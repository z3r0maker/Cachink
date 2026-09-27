/**
 * One push request and its outcomes (A-06): mark the rows in flight, send,
 * record every per-row answer. Also what keeps a request small enough for the
 * platform (DB3-SYNC-01 b) and the pause after a slow answer (DB2-DEV-02).
 */

import {
  ERROR_CATALOG,
  isKnownErrorCode,
  pushRowBytes,
  type Delta,
  type PushResponse,
} from '@xangarro/contracts';
import type { AppConfigRepository, XangarroDatabase } from '@xangarro/data';
import type { ApiClient, ApiResult, ClientErrorCode } from './api-client.js';
import type { CoalescedChange } from './outbox-reader.js';
import type { StatusStore } from './status-store.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

export interface PushDeps {
  readonly db: XangarroDatabase;
  readonly appConfig: AppConfigRepository;
  readonly client: ApiClient;
  readonly token: string;
  readonly now: () => Date;
  /** Deltas per push; the contract's MAX_PUSH_DELTAS unless the server wants fewer. */
  readonly batchLimit?: number;
  /** Awaited before each further request with the last one's duration; default sleeps `pauseAfter`. */
  readonly pace?: (elapsedMs: number) => Promise<void>;
}

export interface SyncError {
  readonly code: ClientErrorCode;
  readonly status: number;
  /** The server's `Retry-After`, when it sent one (DB2-DEV-02). */
  readonly retryAfterMs?: number;
}

export function toSyncError(res: Extract<ApiResult<unknown>, { ok: false }>): SyncError {
  const wait = res.retryAfterMs === undefined ? {} : { retryAfterMs: res.retryAfterMs };
  return { code: res.code, status: res.status, ...wait };
}

const SLOW_ANSWER_MS = 2_000;
const MAX_PAUSE_MS = 10_000;

/** After a slow answer, wait as long as it took (capped): at most half the server's time is ours. */
export function pauseAfter(elapsedMs: number): number {
  return elapsedMs < SLOW_ANSWER_MS ? 0 : Math.min(elapsedMs, MAX_PAUSE_MS);
}

export function sleepAfter(elapsedMs: number): Promise<void> {
  const ms = pauseAfter(elapsedMs);
  return ms === 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

/** Validated deltas and the changes they carry, index for index. */
export interface Prepared {
  readonly deltas: readonly Delta[];
  readonly sent: readonly CoalescedChange[];
}

export const part = (p: Prepared, from: number, to: number): Prepared => ({
  deltas: p.deltas.slice(from, to),
  sent: p.sent.slice(from, to),
});

/**
 * A push body stays under this: the platform answers 4.5 MB with 413, and
 * 500 rows at the row limit would be 8 MB. The rest waits for the next round.
 */
export const MAX_PUSH_BODY_BYTES = 2_000_000;

/** The longest prefix of `p` within `maxBytes` of row JSON — never less than one row. */
export function fitBody(p: Prepared, maxBytes = MAX_PUSH_BODY_BYTES): Prepared {
  let bytes = 0;
  let n = 0;
  for (const d of p.deltas) {
    bytes += pushRowBytes(d);
    if (n > 0 && bytes > maxBytes) break;
    n += 1;
  }
  return n === p.deltas.length ? p : part(p, 0, n);
}

export type Exchange =
  | { readonly ok: true; readonly accepted: number; readonly rejected: number }
  | { readonly ok: false; readonly error: SyncError };

/** Records every per-row answer before anything else moves. */
async function record(deps: PushDeps, store: StatusStore, p: Prepared, data: PushResponse) {
  const byRowId = new Map(p.sent.map((c) => [c.rowId, c] as const));
  for (const a of data.accepted) {
    const c = byRowId.get(a.rowId);
    if (c) await store.markAccepted(c.tableName, c.rowId, a.serverSeq);
  }
  for (const r of data.rejected) {
    const c = byRowId.get(r.rowId);
    const retryable = isKnownErrorCode(r.code) ? ERROR_CATALOG[r.code].retryable : r.retryable;
    if (c)
      await store.markRejected(
        c.tableName,
        c.rowId,
        { code: r.code, message: r.message, retryable },
        deps.now(),
      );
  }
  await deps.appConfig.set(SYNC_CONFIG_KEYS.lastServerTime, data.serverTime);
}

/** One request: the rows go `pending`, then every answer is recorded. */
export async function exchange(deps: PushDeps, store: StatusStore, p: Prepared): Promise<Exchange> {
  await store.markPending(p.sent, deps.now().toISOString());
  const res = await deps.client.push(deps.token, p.deltas);
  if (!res.ok) return { ok: false, error: toSyncError(res) };
  await record(deps, store, p, res.data);
  return { ok: true, accepted: res.data.accepted.length, rejected: res.data.rejected.length };
}
