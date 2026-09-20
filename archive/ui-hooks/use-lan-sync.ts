/**
 * `useLanSync` — reactive snapshot of the active LAN sync handle (P1D-M4
 * / Slice 8 C7).
 *
 * The AppShell calls this hook unconditionally and passes the result into
 * `SyncStatusBadge`. When no `LanSyncProvider` is mounted (Local /
 * Tablet-only / Cloud modes), the returned state stays at the inert
 * defaults — badge code still renders correctly because `SyncStatusBadge`
 * short-circuits on `mode`.
 *
 * The hook never throws. If the underlying handle errors while reading a
 * snapshot we surface it via `lastError`; the shell owns retries.
 */

import { useEffect, useState, useCallback } from 'react';
import type { LanSyncState, LanSyncStatus } from '../sync/lan-bridge';
import { useLanSyncContext } from '../sync/lan-sync-context';

export interface UseLanSyncResult {
  readonly status: LanSyncStatus;
  readonly connectedDevices: number;
  readonly lastServerSeq: number;
  readonly lastError: string | null;
  /** Calling this when the LAN server is unreachable triggers an
   * immediate re-attempt instead of waiting for the back-off timer. */
  readonly retryNow: () => Promise<void>;
}

const INITIAL: LanSyncState = {
  status: 'idle',
  connectedDevices: 0,
  lastServerSeq: 0,
  lastError: null,
};

const NOOP_RETRY = async (): Promise<void> => {
  // Without an active handle there's nothing to retry — returning
  // resolves so callers can `await` unconditionally.
};

export function useLanSync(): UseLanSyncResult {
  const { handle } = useLanSyncContext();
  const [state, setState] = useState<LanSyncState>(() => (handle ? handle.getState() : INITIAL));

  useEffect(() => {
    if (!handle) {
      setState(INITIAL);
      return;
    }
    setState(handle.getState());
    const unsubscribe = handle.subscribe((next) => setState(next));
    return unsubscribe;
  }, [handle]);

  const retryNow = useCallback(async (): Promise<void> => {
    if (!handle) return NOOP_RETRY();
    await handle.retryNow();
  }, [handle]);

  return {
    status: state.status,
    connectedDevices: state.connectedDevices,
    lastServerSeq: state.lastServerSeq,
    lastError: state.lastError,
    retryNow,
  };
}
