/**
 * ObservabilityProvider — React context for the LogStore.
 *
 * Mounted inside `<AppProviders>` after the database is ready. Initializes
 * the `SqliteLogStore`, runs auto-prune, and exposes the store via context.
 *
 * Screens + hooks access the store via `useLogStore()`.
 */

import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import type { LogStore } from '@cachink/observability';

const LogStoreContext = createContext<LogStore | null>(null);

export interface ObservabilityProviderProps {
  readonly children: ReactNode;
  readonly logStore: LogStore | null;
}

export function ObservabilityProvider({ children, logStore }: ObservabilityProviderProps): ReactElement {
  const value = useMemo(() => logStore, [logStore]);
  return <LogStoreContext.Provider value={value}>{children}</LogStoreContext.Provider>;
}

/**
 * Access the LogStore from context. Returns null if observability is not
 * initialized yet (e.g. during splash/loading).
 */
export function useLogStore(): LogStore | null {
  return useContext(LogStoreContext);
}

/**
 * Access the LogStore, throwing if unavailable. Use in components/hooks
 * that REQUIRE observability (e.g. the Telemetría screen).
 */
export function useRequiredLogStore(): LogStore {
  const store = useContext(LogStoreContext);
  if (!store) {
    throw new Error(
      'useRequiredLogStore() called outside <ObservabilityProvider> or before LogStore is initialized.',
    );
  }
  return store;
}
