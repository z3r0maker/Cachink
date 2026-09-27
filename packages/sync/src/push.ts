/**
 * drainPush — sends the outbox to `/sync/push` (A-06, contracts §4).
 *
 * Per round: read the due retries, then the next change-log slice in the
 * room left under the server's per-push limit, coalesce per row, read current
 * rows in one query per table, validate locally (schema and row size), fit
 * the body, send, then record every per-row outcome BEFORE advancing the
 * cursor. The cursor only ever passes rows that were answered or refused, so
 * nothing is skipped (DB3-SYNC-01 b).
 *
 * A batch that fails as a whole for a reason of its own (400, 413, a 5xx that
 * repeats) is halved to the row at fault (`push-split.ts`). One that fails
 * because of the network or the server's load (offline, timeout, 429, 503)
 * leaves the cursor where it was and puts the retries it carried back to
 * `rejected`, so nothing is stranded `pending` (DB2-DEV-01). Between rounds
 * it pauses after a slow answer (DB2-DEV-02). Stops after `maxBatches` so a
 * large backlog never blocks the UI; the next trigger continues.
 */

import { DeltaSchema, MAX_PUSH_DELTAS, maxPushRowBytes, pushRowBytes } from '@xangarro/contracts';
import type { AppConfigRepository } from '@xangarro/data';
import {
  coalesce,
  readChangeSlice,
  type ChangeEntry,
  type CoalescedChange,
} from './outbox-reader.js';
import { fitBody, sleepAfter, type Prepared, type PushDeps, type SyncError } from './push-batch.js';
import { MAX_SPLIT_REQUESTS } from './push-split.js';
import { sendRound, type RoundResult } from './push-round.js';
import { readRows } from './row-reader.js';
import { StatusStore } from './status-store.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';
import { rowKey } from './table-map.js';

export { pauseAfter, toSyncError, type PushDeps, type SyncError } from './push-batch.js';
export { SERVER_REFUSED } from './push-split.js';

export interface PushOutcome {
  /** Requests sent, halving probes included. */
  readonly batches: number;
  readonly accepted: number;
  /** Rows refused: by the server per row, or alone as a whole (`SERVER_REFUSED`). */
  readonly rejected: number;
  readonly error: SyncError | null;
}

const MAX_RETRIES_PER_BATCH = 100;

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

/** Why a row cannot be sent as it is, or null. */
function invalid(c: CoalescedChange, i: number, row: Record<string, unknown>) {
  const parsed = DeltaSchema.safeParse({
    table: c.tableName,
    rowId: c.rowId,
    op: c.op,
    clientSeq: i,
    row,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? 'invalid row' };
  const bytes = pushRowBytes(parsed.data.row);
  const limit = maxPushRowBytes(parsed.data.table);
  return bytes > limit
    ? { message: `row is ${bytes} bytes; ${c.tableName} allows ${limit}` }
    : parsed;
}

/** Build validated deltas; locally invalid rows are rejected (kept, never sent). */
async function prepare(
  deps: PushDeps,
  store: StatusStore,
  changes: readonly CoalescedChange[],
): Promise<Prepared> {
  const rows = await readRows(deps.db, changes);
  const deltas: Prepared['deltas'][number][] = [];
  const sent: CoalescedChange[] = [];
  const gone: CoalescedChange[] = [];
  for (const [i, c] of changes.entries()) {
    const row = rows.get(rowKey(c.tableName, c.rowId));
    if (!row) {
      gone.push(c);
      continue;
    }
    const checked = invalid(c, i, row);
    if ('success' in checked) {
      deltas.push(checked.data);
      sent.push(c);
      continue;
    }
    const rejection = { code: 'VALIDATION', message: checked.message, retryable: false };
    await store.markRejected(c.tableName, c.rowId, rejection, deps.now());
  }
  await store.forget(gone);
  return { deltas, sent };
}

export interface Round {
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

/** The slice's entries in order, up to the first whose row is still to be sent. */
function nextHwm(r: Round, unsettled: readonly CoalescedChange[]): number {
  const open = new Set(unsettled.map((c) => rowKey(c.tableName, c.rowId)));
  let hwm = r.hwm;
  for (const e of r.slice) {
    if (open.has(rowKey(e.tableName, e.rowId))) break;
    hwm = Math.max(hwm, e.id);
  }
  return hwm;
}

/** The rows a round prepared but did not send because the body was full. */
const leftOut = (all: Prepared, fitted: Prepared) => all.sent.slice(fitted.sent.length);

interface Drain {
  readonly deps: PushDeps;
  readonly store: StatusStore;
  readonly budget: { left: number };
  readonly total: { batches: number; accepted: number; rejected: number };
  lastElapsed: number | null;
}

const NOTHING_SENT: RoundResult = {
  ...{ requests: 0, accepted: 0, rejected: 0 },
  ...{ unsettled: [], error: null, halted: false },
};

/** Sends a round's batch, pacing after a slow previous one; times the exchange. */
async function send(d: Drain, r: Round, fitted: Prepared): Promise<RoundResult> {
  if (fitted.deltas.length === 0) return NOTHING_SENT;
  if (d.lastElapsed !== null) await (d.deps.pace ?? sleepAfter)(d.lastElapsed);
  const started = Date.now();
  const result = await sendRound(d.deps, d.store, r, fitted, d.budget);
  d.lastElapsed = Date.now() - started;
  d.total.batches += result.requests;
  d.total.accepted += result.accepted;
  d.total.rejected += result.rejected;
  return result;
}

/** One round: send, then move the cursor over what was settled. Null = go on. */
async function drainRound(d: Drain, r: Round): Promise<SyncError | 'stop' | null> {
  const all = await prepare(d.deps, d.store, dedupe([...coalesce(r.slice), ...r.retries]));
  const fitted = fitBody(all);
  const result = await send(d, r, fitted);
  const next = nextHwm(r, [...result.unsettled, ...leftOut(all, fitted)]);
  if (next !== r.hwm) await d.deps.appConfig.set(SYNC_CONFIG_KEYS.pushHwm, String(next));
  if (result.error) return result.error;
  // Only retries, and none of them left to send (their rows are gone): stop (DB3-L-03).
  const drained =
    r.slice.length === 0 && (r.retries.length < r.retryLimit || all.sent.length === 0);
  return result.halted || drained ? 'stop' : null;
}

export async function drainPush(deps: PushDeps, maxBatches = 10): Promise<PushOutcome> {
  const limit = deps.batchLimit ?? MAX_PUSH_DELTAS;
  const store = new StatusStore(deps.db);
  const total = { batches: 0, accepted: 0, rejected: 0 };
  const d: Drain = { deps, store, budget: { left: MAX_SPLIT_REQUESTS }, total, lastElapsed: null };
  for (let round = 0; round < maxBatches; round += 1) {
    const r = await readRound(deps, store, limit);
    if (r.slice.length === 0 && r.retries.length === 0) break;
    const end = await drainRound(d, r);
    if (end === 'stop') break;
    if (end !== null) return { ...total, error: end };
  }
  return { ...total, error: null };
}
