/**
 * LanSyncContext — owns the live {@link LanSyncHandle} produced by the
 * app-shell route when `mode === 'lan'`. Without a provider at the root,
 * `useLanSync()` returns an inert snapshot so every consumer (primarily
 * `SyncStatusBadge` in the AppShell) can call the hook unconditionally.
 *
 * Shape matches the rest of `@cachink/ui/sync`: lazy-imported behind a
 * narrow interface so Local-standalone / Cloud bundles never pull in
 * `@cachink/sync-lan`. The provider simply stores the handle — it does
 * NOT call `initLanSync` — because lifecycle ownership belongs to the
 * shell route, not the UI tree.
 */

import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import type { LanSyncHandle } from './lan-bridge';

export interface LanSyncContextValue {
  /** Active handle, or `null` when the app is not in LAN mode. */
  readonly handle: LanSyncHandle | null;
}

const DEFAULT: LanSyncContextValue = { handle: null };

export const LanSyncContext = createContext<LanSyncContextValue>(DEFAULT);

export interface LanSyncProviderProps {
  readonly handle: LanSyncHandle | null;
  readonly children: ReactNode;
}

export function LanSyncProvider(props: LanSyncProviderProps): ReactElement {
  return (
    <LanSyncContext.Provider value={{ handle: props.handle }}>
      {props.children}
    </LanSyncContext.Provider>
  );
}

/** Internal helper — `useLanSync` consumes this. */
export function useLanSyncContext(): LanSyncContextValue {
  return useContext(LanSyncContext);
}
