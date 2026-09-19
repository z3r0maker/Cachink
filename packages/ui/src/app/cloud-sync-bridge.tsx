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
import { useQueryClient } from '@tanstack/react-query';
import { SyncEngine, type RejectedRow, type SyncRunResult } from '@xangarro/sync';
import { useActivationContext } from '../activation/activation-context';
import { forgetDevice } from '../activation/forget-device';
import { useActivationState } from '../activation/use-activation-state';
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
  /** Rows the server refused, with local data ("No enviados", A-08). */
  readonly listRejected: () => Promise<readonly RejectedRow[]>;
  /** Manual retry of rejected rows: all due now, then one push. */
  readonly requeue: (rows: readonly RowRef[]) => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextValue>({
  state: INITIAL_CLOUD_SYNC_STATE,
  syncNow: () => undefined,
  listRejected: async () => [],
  requeue: async () => undefined,
});

export interface RowRef {
  readonly tableName: string;
  readonly rowId: string;
}

export const useCloudSync = (): CloudSyncContextValue => useContext(CloudSyncContext);

/** Prefix for queries derived from sync state; invalidated after every run. */
export const CLOUD_SYNC_QUERY_KEY = ['cloudSync'] as const;

function phaseOf(result: SyncRunResult): CloudSyncPhase {
  const error = result.push?.error ?? result.pull?.error ?? null;
  if (!error) return 'idle';
  return error.code === 'NETWORK' ? 'offline' : 'error';
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
      // Row outcomes may change without the counts changing (a manual retry
      // rejected again), so "No enviados" always refreshes after a run.
      await queryClient.invalidateQueries({ queryKey: CLOUD_SYNC_QUERY_KEY });
      if ((result.pull?.applied ?? 0) > 0) await queryClient.invalidateQueries();
    };
    // A throw (e.g. a SQLite error during the retention purge) must not leave
    // the pill stuck on "Sincronizando…"; the next trigger retries.
    const runSafely = (mode: 'push' | 'both'): void => {
      run(mode).catch((error: unknown) => {
        console.error('[cloud-sync] run failed', error);
        setState((s) => ({ ...s, phase: 'error' }));
      });
    };
    return { runPush: () => runSafely('push'), runSync: () => runSafely('both') };
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
    () => ({
      state,
      syncNow: runner.runSync,
      listRejected: () => engine.rejected(),
      requeue: async (rows) => {
        for (const r of rows) await engine.requeue(r.tableName, r.rowId);
        runner.runPush();
      },
    }),
    [state, runner, engine],
  );
  return <CloudSyncContext.Provider value={value}>{props.children}</CloudSyncContext.Provider>;
}
