/**
 * Internal bridge components for AppProviders.
 *
 * Extracted from app-providers.tsx to keep file size under 200 lines
 * (CLAUDE.md 2.6).
 */

import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { DrizzleAppConfigRepository, readSyncState } from '@cachink/data';
import { createLogStore, type LogStore } from '@cachink/observability';
import { useDatabase } from '../database/index';
import { AppConfigProvider, useAppConfigHydrated, useCrashReportingEnabled, useDeviceId, useUserId } from '../app-config/index';
import { captureException, initSentryIfConsented } from '../telemetry/index';
import { ObservabilityProvider, useLogStore } from '../observability/observability-provider';
import { useErrorToastStore } from '../observability/error-toast-store';
import { useLifecycleObserver } from '../observability/use-lifecycle-observer';
import { setLogStoreRef } from '../observability/log-store-ref';
import { buildDrizzleRepositories, RepositoryProvider } from './repository-provider';

export function DrizzleAppConfigBridge({ children }: { readonly children: ReactNode }): ReactElement {
  const db = useDatabase();
  const repo = useMemo(() => new DrizzleAppConfigRepository(db), [db]);
  const resolveLegacyLan = useCallback(async (): Promise<'lan-server' | 'lan-client'> => {
    try {
      const role = await readSyncState(db, 'lanRole');
      return role === 'host' ? 'lan-server' : 'lan-client';
    } catch { return 'lan-client'; }
  }, [db]);
  return <AppConfigProvider appConfig={repo} resolveLegacyLan={resolveLegacyLan}>{children}</AppConfigProvider>;
}

export function DrizzleRepositoryBridge({ children }: { readonly children: ReactNode }): ReactElement | null {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const repositories = useMemo(() => {
    if (!deviceId) return null;
    return buildDrizzleRepositories(db, deviceId, userId);
  }, [db, deviceId, userId]);
  if (!repositories) return null;
  return <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>;
}

export function TelemetryBridge({ children }: { readonly children: ReactNode }): ReactElement {
  const hydrated = useAppConfigHydrated();
  const consent = useCrashReportingEnabled();
  useEffect(() => {
    if (!hydrated) return;
    void initSentryIfConsented(consent);
  }, [hydrated, consent]);
  return <>{children}</>;
}

export function ObservabilityBridge({
  children, logStoreRef,
}: { readonly children: ReactNode; readonly logStoreRef: { current: LogStore | null } }): ReactElement {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const [logStore, setLogStore] = useState<LogStore | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    void createLogStore({
      db: (db as unknown as { $client: unknown }).$client as never,
      deviceId,
      isDev: typeof __DEV__ !== 'undefined' && __DEV__,
    }).then((store) => {
      if (!cancelled) { setLogStore(store); logStoreRef.current = store; }
    });
    return () => { cancelled = true; };
  }, [db, deviceId, logStoreRef]);

  return (
    <ObservabilityProvider logStore={logStore}>
      <LifecycleObserverBridge>{children}</LifecycleObserverBridge>
    </ObservabilityProvider>
  );
}

function LifecycleObserverBridge({ children }: { readonly children: ReactNode }): ReactElement {
  useLifecycleObserver();
  const logStore = useLogStore();
  useEffect(() => {
    setLogStoreRef(logStore);
    return () => setLogStoreRef(null);
  }, [logStore]);
  return <>{children}</>;
}

export function buildQueryClient(logStoreRef: { current: LogStore | null }): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 0, staleTime: Infinity },
      mutations: {
        onError(error) {
          const store = logStoreRef.current;
          if (store) {
            void store.writeError({
              id: '', timestamp: new Date().toISOString(), source: 'ui',
              errorName: error instanceof Error ? error.name : 'UnknownError',
              errorMessage: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
              userId: null, deviceId: '', businessId: null,
            }).catch(() => {});
          }
          useErrorToastStore.getState().push({
            message: error instanceof Error ? error.message : 'Algo salió mal',
            severity: 'error',
          });
          if (error instanceof Error) captureException(error);
        },
      },
    },
  });
}
