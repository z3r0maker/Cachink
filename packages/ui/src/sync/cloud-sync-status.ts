/**
 * Cloud sync status as the UI sees it, and the pure mapping to the pill
 * (A-07). Rejected rows win over pending ones: they need a human; pending
 * ones resolve on their own.
 */

import type { SyncCounts } from '@xangarro/sync';

export type CloudSyncPhase = 'idle' | 'syncing' | 'offline' | 'error';

export interface CloudSyncState {
  readonly phase: CloudSyncPhase;
  readonly counts: SyncCounts;
  /** ISO time of the last run that reached the server. */
  readonly lastSyncAt: string | null;
}

export const INITIAL_CLOUD_SYNC_STATE: CloudSyncState = {
  phase: 'idle',
  counts: { pending: 0, rejected: 0, retrying: 0 },
  lastSyncAt: null,
};

export type PillTone = 'ok' | 'busy' | 'warn' | 'danger';

export interface PillView {
  readonly labelKey:
    | 'syncPill.syncing'
    | 'syncPill.rejected'
    | 'syncPill.offline'
    | 'syncPill.pending'
    | 'syncPill.synced'
    | 'syncPill.never';
  readonly count?: number;
  readonly time?: string;
  readonly tone: PillTone;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function pillView(state: CloudSyncState): PillView {
  if (state.phase === 'syncing') return { labelKey: 'syncPill.syncing', tone: 'busy' };
  if (state.counts.rejected > 0) {
    return { labelKey: 'syncPill.rejected', count: state.counts.rejected, tone: 'danger' };
  }
  const waiting = state.counts.pending + state.counts.retrying;
  if (state.phase === 'offline')
    return { labelKey: 'syncPill.offline', count: waiting, tone: 'warn' };
  if (waiting > 0) return { labelKey: 'syncPill.pending', count: waiting, tone: 'warn' };
  if (state.lastSyncAt)
    return { labelKey: 'syncPill.synced', time: hhmm(state.lastSyncAt), tone: 'ok' };
  return { labelKey: 'syncPill.never', tone: 'warn' };
}
