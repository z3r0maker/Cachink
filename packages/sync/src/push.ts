/**
 * drainPush — sends the outbox to `/sync/push` (A-06, contracts §4).
 *
 * Per batch: read the due retries, then the next change-log slice in the
 * room left under the server's per-push limit, coalesce per row, read current
 * rows in one query per table, validate locally, send, then record every
 * per-row outcome BEFORE advancing the cursor. A batch that fails as a whole
 * (offline, 5xx, 429, timeout, auth) leaves the cursor where it was and puts
 * the retries it carried back to `rejected` with their next backoff, so
 * nothing is skipped and nothing is stranded `pending` (DB2-DEV-01). Between
 * batches it pauses after a slow answer, so a device flushing a long
 * offline backlog yields to the others (DB2-DEV-02). Stops after
 * `maxBatches` so a large backlog never blocks the UI; the next trigger
 * continues.
 */

import {
  DeltaSchema,
  ERROR_CATALOG,
  MAX_PUSH_DELTAS,
  isKnownErrorCode,
  type Delta,
} from '@xangarro/contracts';
import type { AppConfigRepository, XangarroDatabase } from '@xangarro/data';
import type { ApiClient, ApiResult, ClientErrorCode } from './api-client.js';
import {
  coalesce,
  readChangeSlice,
  type ChangeEntry,
  type CoalescedChange,
} from './outbox-reader.js';
import { readRows } from './row-reader.js';
import { StatusStore } from './status-store.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';
import { rowKey } from './table-map.js';

export interface PushDeps {
  readonly db: XangarroDatabase;
  readonly appConfig: AppConfigRepository;
  readonly client: ApiClient;
  readonly token: string;
  readonly now: () => Date;
  /** Deltas per push; the contract's MAX_PUSH_DELTAS unless the server wants fewer. */
  readonly batchLimit?: number;
  /** Awaited before each further batch with the last one's duration; default sleeps `pauseAfter`. */
  readonly pace?: (elapsedMs: number) => Promise<void>;
}

export interface SyncError {
  readonly code: ClientErrorCode;
  readonly status: number;
  /** The server's `Retry-After`, when it sent one (DB2-DEV-02). */
  readonly retryAfterMs?: number;
}

const MAX_RETRIES_PER_BATCH = 100;
const SLOW_ANSWER_MS = 2_000;
const MAX_PAUSE_MS = 10_000;

/** After a slow answer, wait as long as it took (capped): at most half the server's time is ours. */
export function pauseAfter(elapsedMs: number): number {
  return elapsedMs < SLOW_ANSWER_MS ? 0 : Math.min(elapsedMs, MAX_PAUSE_MS);
}

function sleepAfter(elapsedMs: number): Promise<void> {
  const ms = pauseAfter(elapsedMs);
  return ms === 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function toSyncError(res: Extract<ApiResult<unknown>, { ok: false }>): SyncError {
  const wait = res.retryAfterMs === undefined ? {} : { retryAfterMs: res.retryAfterMs };
  return { code: res.code, status: res.status, ...wait };
}

export interface PushOutcome {
  readonly batches: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly error: SyncError | null;
}

interface Prepared {
  readonly deltas: Delta[];
  readonly sent: CoalescedChange[];
}

type BatchResult = { accepted: number; rejected: number } | { error: SyncError };

async function readCursor(appConfig: AppConfigRepository): Promise<number> {
  return Number((await appConfig.get(SYNC_CONFIG_KEYS.pushHwm)) ?? '0') || 0;
}

function dedupe(changes: readonly CoalescedChange[]): CoalescedChange[] {
  const seen = new Set<string>();
  return changes.filter((c) => {
    const k = rowKey(c.tableName, c.rowId);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Build validated deltas; locally invalid rows are rejected (kept, never sent). */
async function prepare(
  deps: PushDeps,
  store: StatusStore,
  changes: readonly CoalescedChange[],
): Promise<Prepared> {
  const rows = await readRows(deps.db, changes);
  const deltas: Delta[] = [];
  const sent: CoalescedChange[] = [];
  for (const [i, c] of changes.entries()) {
    const row = rows.get(rowKey(c.tableName, c.rowId));
    if (!row) continue;
    const parsed = DeltaSchema.safeParse({
      table: c.tableName,
      rowId: c.rowId,
      op: c.op,
      clientSeq: i,
      row,
    });
    if (parsed.success) {
      deltas.push(parsed.data);
      sent.push(c);
      continue;
    }
    const message = parsed.error.issues[0]?.message ?? 'invalid row';
    await store.markRejected(
      c.tableName,
      c.rowId,
      { code: 'VALIDATION', message, retryable: false },
      deps.now(),
    );
  }
  return { deltas, sent };
}

/** Send one batch and record every per-row outcome. */
async function sendBatch(
  deps: PushDeps,
  store: StatusStore,
  prepared: Prepared,
  retried: ReadonlySet<string>,
): Promise<BatchResult> {
  await store.markPending(prepared.sent, deps.now().toISOString());
  const res = await deps.client.push(deps.token, prepared.deltas);
  if (!res.ok) {
    const back = prepared.sent.filter((c) => retried.has(rowKey(c.tableName, c.rowId)));
    await store.restoreRetries(back, deps.now());
    return { error: toSyncError(res) };
  }
  const byRowId = new Map(prepared.sent.map((c) => [c.rowId, c] as const));
  for (const a of res.data.accepted) {
    const c = byRowId.get(a.rowId);
    if (c) await store.markAccepted(c.tableName, c.rowId, a.serverSeq);
  }
  for (const r of res.data.rejected) {
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
  await deps.appConfig.set(SYNC_CONFIG_KEYS.lastServerTime, res.data.serverTime);
  return { accepted: res.data.accepted.length, rejected: res.data.rejected.length };
}

interface Round {
  readonly hwm: number;
  readonly slice: readonly ChangeEntry[];
  readonly retries: readonly CoalescedChange[];
  readonly retryLimit: number;
}

/** Due retries first (at most half the batch), then the slice in the room left. */
async function readRound(deps: PushDeps, store: StatusStore, limit: number): Promise<Round> {
  const retryLimit = Math.min(MAX_RETRIES_PER_BATCH, Math.max(1, Math.floor(limit / 2)));
  const retries = await store.dueRetries(deps.now(), retryLimit);
  const hwm = await readCursor(deps.appConfig);
  const room = limit - retries.length;
  const slice = room > 0 ? await readChangeSlice(deps.db, hwm, room) : [];
  return { hwm, slice, retries, retryLimit };
}

/** Sends a round's deltas, pacing after a slow previous batch; times the exchange. */
async function sendRound(
  deps: PushDeps,
  store: StatusStore,
  r: Round,
  prepared: Prepared,
  lastElapsed: number | null,
): Promise<{ result: BatchResult; elapsed: number }> {
  if (lastElapsed !== null) await (deps.pace ?? sleepAfter)(lastElapsed);
  const started = Date.now();
  const retried = new Set(r.retries.map((c) => rowKey(c.tableName, c.rowId)));
  const result = await sendBatch(deps, store, prepared, retried);
  return { result, elapsed: Date.now() - started };
}

export async function drainPush(deps: PushDeps, maxBatches = 10): Promise<PushOutcome> {
  const store = new StatusStore(deps.db);
  const limit = deps.batchLimit ?? MAX_PUSH_DELTAS;
  const total = { batches: 0, accepted: 0, rejected: 0 };
  let lastElapsed: number | null = null;
  for (let round = 0; round < maxBatches; round += 1) {
    const r = await readRound(deps, store, limit);
    if (r.slice.length === 0 && r.retries.length === 0) break;
    const prepared = await prepare(deps, store, dedupe([...coalesce(r.slice), ...r.retries]));
    if (prepared.deltas.length > 0) {
      const sent = await sendRound(deps, store, r, prepared, lastElapsed);
      lastElapsed = sent.elapsed;
      total.batches += 1;
      if ('error' in sent.result) return { ...total, error: sent.result.error };
      total.accepted += sent.result.accepted;
      total.rejected += sent.result.rejected;
    }
    const nextHwm = r.slice.reduce((m, e) => Math.max(m, e.id), r.hwm);
    await deps.appConfig.set(SYNC_CONFIG_KEYS.pushHwm, String(nextHwm));
    if (r.slice.length === 0 && r.retries.length < r.retryLimit) break;
  }
  return { ...total, error: null };
}
