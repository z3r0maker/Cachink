/**
 * CloudSyncBridge — runs the cloud SyncEngine inside the app (A-07).
 *
 * Bridge layer (like DrizzleRepositoryBridge): it owns the database handle
 * and turns engine results into UI state. Triggers come from SyncScheduler:
 * foreground/resume and a 15-min interval run a full sync; every successful
 * mutation (all app writes go through React Query) schedules a debounced
 * push. A revoked device loses its token and activation record — never its
 * data — and the gate sends it back to activation.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { AppConfigRepository } from '@xangarro/data';
import { SyncEngine, type SyncRunResult } from '@xangarro/sync';
import { APP_CONFIG_KEYS } from '../app-config/index';
import { useActivationContext } from '../activation/activation-context';
import type { DeviceTokenStore } from '../activation/activation-config';
import { ACTIVATION_QUERY_KEY, useActivationState } from '../activation/use-activation-state';
import { useDatabase } from '../database/index';
import {
  INITIAL_CLOUD_SYNC_STATE,
  type CloudSyncPhase,
  type CloudSyncState,
} from '../sync/cloud-sync-status';
import { SyncScheduler } from '../sync/sync-scheduler';
import { useAppConfigRepository } from './repository-provider';

export interface CloudSyncContextValue {
  readonly state: CloudSyncState;
  /** "Actualizar": push then pull now. */
  readonly syncNow: () => void;
  /** Manual retry of a rejected row ("No enviados", A-08). */
  readonly requeue: (tableName: string, rowId: string) => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextValue>({
  state: INITIAL_CLOUD_SYNC_STATE,
  syncNow: () => undefined,
  requeue: async () => undefined,
});

export const useCloudSync = (): CloudSyncContextValue => useContext(CloudSyncContext);

function phaseOf(result: SyncRunResult): CloudSyncPhase {
  const error = result.push?.error ?? result.pull?.error ?? null;
  if (!error) return 'idle';
  return error.code === 'NETWORK' ? 'offline' : 'error';
}

async function forgetDevice(deps: {
  appConfig: AppConfigRepository;
  tokenStore: DeviceTokenStore;
  queryClient: QueryClient;
}): Promise<void> {
  await deps.tokenStore.clear();
  await deps.appConfig.delete(APP_CONFIG_KEYS.activation);
  await deps.queryClient.invalidateQueries({ queryKey: ACTIVATION_QUERY_KEY });
}

function useSyncRunner(
  engine: SyncEngine,
  setState: (fn: (s: CloudSyncState) => CloudSyncState) => void,
) {
  const { config } = useActivationContext();
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();
  return useMemo(() => {
    const run = async (mode: 'push' | 'both'): Promise<void> => {
      setState((s) => ({ ...s, phase: 'syncing' }));
      const result = mode === 'push' ? await engine.pushOnly() : await engine.syncNow();
      if (result.revoked)
        await forgetDevice({ appConfig, tokenStore: config.tokenStore, queryClient });
      const counts = await engine.counts();
      const phase = phaseOf(result);
      const reached = result.push !== null && phase !== 'offline';
      setState((s) => ({
        phase,
        counts,
        lastSyncAt: reached ? new Date().toISOString() : s.lastSyncAt,
      }));
      if ((result.pull?.applied ?? 0) > 0) await queryClient.invalidateQueries();
    };
    return { runPush: () => void run('push'), runSync: () => void run('both') };
  }, [engine, setState, appConfig, config.tokenStore, queryClient]);
}

function useSchedulerWiring(
  runner: { runPush: () => void; runSync: () => void },
  activated: boolean,
): void {
  const queryClient = useQueryClient();
  const schedulerRef = useRef<SyncScheduler | null>(null);
  useEffect(() => {
    const scheduler = new SyncScheduler(runner);
    schedulerRef.current = scheduler;
    const unsubscribeWrites = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.mutation.state.status === 'success')
        scheduler.noteWrite();
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') scheduler.onForeground();
      else scheduler.onBackground();
    });
    return () => {
      unsubscribeWrites();
      appState.remove();
      scheduler.dispose();
    };
  }, [runner, queryClient]);
  useEffect(() => {
    if (activated) schedulerRef.current?.onForeground();
  }, [activated]);
}

export function CloudSyncBridge(props: { readonly children: ReactNode }): ReactElement {
  const db = useDatabase();
  const { client, config } = useActivationContext();
  const { record } = useActivationState();
  const [state, setState] = useState<CloudSyncState>(INITIAL_CLOUD_SYNC_STATE);
  const engine = useMemo(
    () => new SyncEngine({ db, client, getToken: () => config.tokenStore.get() }),
    [db, client, config.tokenStore],
  );
  const runner = useSyncRunner(engine, setState);
  useSchedulerWiring(runner, Boolean(record));
  const value = useMemo<CloudSyncContextValue>(
    () => ({ state, syncNow: runner.runSync, requeue: (t, id) => engine.requeue(t, id) }),
    [state, runner, engine],
  );
  return <CloudSyncContext.Provider value={value}>{props.children}</CloudSyncContext.Provider>;
}
