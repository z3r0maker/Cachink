/**
 * ObservabilityBridge — creates the SQLite log store once the device id is
 * known, wires the outbox flusher when a remote ingest URL is configured, and
 * mounts the lifecycle observer. Split from app-provider-bridges.tsx to keep
 * both files under the 200-line cap (CLAUDE.md §2.6).
 */

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import {
  createLogStore,
  HttpRemoteLogStore,
  OutboxFlusher,
  type DeviceContext,
  type LogStore,
} from '@xangarro/observability';
import { useDatabase } from '../database/index';
import { useCrashReportingEnabled, useDeviceId } from '../app-config/index';
import { ObservabilityProvider, useLogStore } from '../observability/observability-provider';
import { useOutboxFlusher } from '../observability/use-outbox-flusher';
import { useLifecycleObserver } from '../observability/use-lifecycle-observer';
import { setLogStoreRef } from '../observability/log-store-ref';

export interface ObservabilityBridgeProps {
  readonly children: ReactNode;
  readonly logStoreRef: { current: LogStore | null };
  /** Supplied by mobile/desktop shells for device context enrichment. */
  readonly deviceContext?: DeviceContext | null;
  /** Live accessor for current feature-flag state. */
  readonly getFeatureFlags?: () => Record<string, boolean> | null;
}

function readBugIngestUrl(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const url = process.env.EXPO_PUBLIC_BUG_INGEST_URL;
    if (typeof url === 'string' && url.length > 0) return url;
  }
  // Desktop (Vite)
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (env?.VITE_BUG_INGEST_URL) return env.VITE_BUG_INGEST_URL;
  } catch {
    /* not available */
  }
  return undefined;
}

function readAnonKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.EXPO_PUBLIC_CLOUD_ANON_KEY;
    if (typeof key === 'string' && key.length > 0) return key;
  }
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (env?.VITE_CLOUD_ANON_KEY) return env.VITE_CLOUD_ANON_KEY;
  } catch {
    /* not available */
  }
  return undefined;
}

interface StoreDeps {
  readonly db: ReturnType<typeof useDatabase>;
  readonly deviceId: ReturnType<typeof useDeviceId>;
  readonly consent: ReturnType<typeof useCrashReportingEnabled>;
  readonly logStoreRef: ObservabilityBridgeProps['logStoreRef'];
  readonly deviceContext: ObservabilityBridgeProps['deviceContext'];
  readonly getFeatureFlags: ObservabilityBridgeProps['getFeatureFlags'];
}

function buildFlusher(store: LogStore, deps: StoreDeps): OutboxFlusher | null {
  const ingestUrl = readBugIngestUrl();
  if (!ingestUrl || !deps.deviceContext) return null;
  const remote = new HttpRemoteLogStore({ baseUrl: ingestUrl, apiKey: readAnonKey() });
  return new OutboxFlusher({
    logStore: store,
    remote,
    deviceContext: deps.deviceContext,
    getFeatureFlags: deps.getFeatureFlags ?? (() => null),
    getConsent: () => deps.consent,
  });
}

/** Creates the SQLite log store once the device id is known; builds the outbox flusher if a remote is configured. */
function useObservabilityStore(deps: StoreDeps): {
  logStore: LogStore | null;
  flusher: OutboxFlusher | null;
} {
  const [logStore, setLogStore] = useState<LogStore | null>(null);
  const [flusher, setFlusher] = useState<OutboxFlusher | null>(null);
  const { db, deviceId, logStoreRef, deviceContext, getFeatureFlags, consent } = deps;
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
      setFlusher(buildFlusher(store, deps));
    });
    return () => {
      cancelled = true;
    };
  }, [db, deviceId, logStoreRef, deviceContext, getFeatureFlags, consent]);
  return { logStore, flusher };
}

export function ObservabilityBridge({
  children,
  logStoreRef,
  deviceContext,
  getFeatureFlags,
}: ObservabilityBridgeProps): ReactElement {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const consent = useCrashReportingEnabled();
  const { logStore, flusher } = useObservabilityStore({
    db,
    deviceId,
    consent,
    logStoreRef,
    deviceContext,
    getFeatureFlags,
  });
  return (
    <ObservabilityProvider logStore={logStore}>
      <LifecycleObserverBridge flusher={flusher}>{children}</LifecycleObserverBridge>
    </ObservabilityProvider>
  );
}

function LifecycleObserverBridge({
  children,
  flusher,
}: {
  readonly children: ReactNode;
  readonly flusher: OutboxFlusher | null;
}): ReactElement {
  useLifecycleObserver();
  useOutboxFlusher(flusher);
  const logStore = useLogStore();
  useEffect(() => {
    setLogStoreRef(logStore);
    return () => setLogStoreRef(null);
  }, [logStore]);
  return <>{children}</>;
}
