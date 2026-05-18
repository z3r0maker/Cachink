/**
 * Module-level LogStore reference for use by class components (ErrorBoundary)
 * that can't call hooks.
 *
 * Set by LifecycleObserverBridge (inside ObservabilityBridge) on init.
 * Read by AppErrorBoundary.componentDidCatch.
 */

import type { LogStore } from '@cachink/observability';

let _logStoreRef: LogStore | null = null;

export function setLogStoreRef(store: LogStore | null): void {
  _logStoreRef = store;
}

export function getLogStoreRef(): LogStore | null {
  return _logStoreRef;
}
