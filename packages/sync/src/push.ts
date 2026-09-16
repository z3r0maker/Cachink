/**
 * drainPush — sends the outbox to `/sync/push` (A-06, contracts §4).
 *
 * Per batch: read the next change-log slice + due retries, coalesce per row,
 * read current rows in one query per table, validate locally, send, then
 * record every per-row outcome BEFORE advancing the cursor. A batch that
 * fails as a whole (offline, 5xx, auth) leaves the cursor where it was, so
 * nothing is skipped. Stops after `maxBatches` so a large backlog never
 * blocks the UI; the next trigger continues.
 */

import { DeltaSchema, ERROR_CATALOG, isKnownErrorCode, type Delta } from '@xangarro/contracts';
import type { AppConfigRepository, XangarroDatabase } from '@xangarro/data';
import type { ApiClient, ClientErrorCode } from './api-client.js';
import { coalesce, readChangeSlice, type CoalescedChange } from './outbox-reader.js';
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
}

export interface SyncError {
  readonly code: ClientErrorCode;
  readonly status: number;
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
): Promise<BatchResult> {
  await store.markPending(prepared.sent, deps.now().toISOString());
  const res = await deps.client.push(deps.token, prepared.deltas);
  if (!res.ok) return { error: { code: res.code, status: res.status } };
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

export async function drainPush(deps: PushDeps, maxBatches = 10): Promise<PushOutcome> {
  const store = new StatusStore(deps.db);
  const total = { batches: 0, accepted: 0, rejected: 0 };
  while (total.batches < maxBatches) {
    const hwm = await readCursor(deps.appConfig);
    const slice = await readChangeSlice(deps.db, hwm);
    const retries = await store.dueRetries(deps.now(), 100);
    if (slice.length === 0 && retries.length === 0) break;
    const prepared = await prepare(deps, store, dedupe([...coalesce(slice), ...retries]));
    const nextHwm = slice.reduce((m, e) => Math.max(m, e.id), hwm);
    if (prepared.deltas.length > 0) {
      const result = await sendBatch(deps, store, prepared);
      total.batches += 1;
      if ('error' in result) return { ...total, error: result.error };
      total.accepted += result.accepted;
      total.rejected += result.rejected;
    }
    await deps.appConfig.set(SYNC_CONFIG_KEYS.pushHwm, String(nextHwm));
    if (slice.length === 0) break;
  }
  return { ...total, error: null };
}
