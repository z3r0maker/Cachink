/**
 * Cloud sync status as the UI sees it, and the pure mapping to the pill
 * (A-07). Rejected rows win over pending ones: they need a human; pending
 * ones resolve on their own. «Pending» is everything not accepted yet —
 * captures never tried included — the caja's definition too (DB3-CAJA-02).
 */

import { pillEnvio, type Reintento } from '@xangarro/caja';
import type { SyncCounts } from '@xangarro/sync';

export type CloudSyncPhase = 'idle' | 'syncing' | 'offline' | 'error';

export interface CloudSyncState {
  readonly phase: CloudSyncPhase;
  readonly counts: SyncCounts;
  /** ISO time of the last run that reached the server. */
  readonly lastSyncAt: string | null;
  /** When the engine goes again by itself after a failed run, and why (DS-05). */
  readonly reintento?: Reintento | null;
}

export const INITIAL_CLOUD_SYNC_STATE: CloudSyncState = {
  phase: 'idle',
  counts: { pending: 0, rejected: 0, retrying: 0, unsent: 0 },
  lastSyncAt: null,
};

export type PillTone = 'ok' | 'busy' | 'warn' | 'retry' | 'danger';

export interface PillView {
  readonly labelKey:
    | 'syncPill.syncing'
    | 'syncPill.rejected'
    | 'syncPill.offline'
    | 'syncPill.pending'
    | 'syncPill.synced'
    | 'syncPill.never'
    | 'syncPill.retrying';
  readonly count?: number;
  readonly time?: string;
  /** Said as is, not translated: the shared wording (`pillEnvio`, DS-05). */
  readonly texto?: string;
  readonly tone: PillTone;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** «Reintentando en 1 min», «Reintento: 7:42 p. m.» (EsMvReintentando), when it applies. */
function reintentando(state: CloudSyncState, ahora: number): PillView | null {
  const pill = pillEnvio({
    enLinea: true,
    enviando: false,
    pendientes: state.counts.unsent,
    rechazados: 0,
    reintento: state.reintento ?? null,
    ahora,
  });
  if (pill.estado !== 'reintentando') return null;
  return { labelKey: 'syncPill.retrying', texto: pill.corta, tone: 'retry' };
}

export function pillView(state: CloudSyncState, ahora: number = Date.now()): PillView {
  if (state.phase === 'syncing') return { labelKey: 'syncPill.syncing', tone: 'busy' };
  if (state.counts.rejected > 0) {
    return { labelKey: 'syncPill.rejected', count: state.counts.rejected, tone: 'danger' };
  }
  const waiting = state.counts.unsent;
  if (state.phase === 'offline')
    return { labelKey: 'syncPill.offline', count: waiting, tone: 'warn' };
  const retry = reintentando(state, ahora);
  if (retry !== null) return retry;
  if (waiting > 0) return { labelKey: 'syncPill.pending', count: waiting, tone: 'warn' };
  if (state.lastSyncAt)
    return { labelKey: 'syncPill.synced', time: hhmm(state.lastSyncAt), tone: 'ok' };
  return { labelKey: 'syncPill.never', tone: 'warn' };
}
