/**
 * ObservabilityBridge — creates the SQLite log store once the device id is
 * known and mounts the lifecycle observer. Split from app-provider-bridges.tsx
 * to keep both files under the 200-line cap (CLAUDE.md §2.6).
 *
 * The log stays on the device (N-81, ADR-140). This bridge once also flushed
 * error batches to a Supabase edge function with the public anon key; that
 * function is gone and nothing replaces the flush. What leaves the phone is a
 * bug report the person sends («Reportar un problema», through the device
 * API) and crash telemetry through Sentry, both behind the same consent.
 */

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createLogStore, type LogStore } from '@xangarro/observability';
import { useDatabase } from '../database/index';
import { useDeviceId } from '../app-config/index';
import { ObservabilityProvider, useLogStore } from '../observability/observability-provider';
import { useLifecycleObserver } from '../observability/use-lifecycle-observer';
import { setLogStoreRef } from '../observability/log-store-ref';

export interface ObservabilityBridgeProps {
  readonly children: ReactNode;
  readonly logStoreRef: { current: LogStore | null };
}

/** Creates the SQLite log store once the device id is known. */
function useObservabilityStore(
  logStoreRef: ObservabilityBridgeProps['logStoreRef'],
): LogStore | null {
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
      if (cancelled) return;
      setLogStore(store);
      logStoreRef.current = store;
    });
    return () => {
      cancelled = true;
    };
  }, [db, deviceId, logStoreRef]);
  return logStore;
}

export function ObservabilityBridge({
  children,
  logStoreRef,
}: ObservabilityBridgeProps): ReactElement {
  const logStore = useObservabilityStore(logStoreRef);
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
