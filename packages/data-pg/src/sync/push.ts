import { eq, sql, type SQL } from 'drizzle-orm';

import { devices } from '../schema/portal.js';
import { syncReceipts } from '../schema/sync.js';
import { committedCursor, type Tx } from './cursor.js';
import { excluded, textArray } from './push-rows.js';

/**
 * A push's bookkeeping, one statement per kind for the whole batch (B-08;
 * audit DB2-SYNC-01; ADR-120): the receipts it is answered from, the receipts
 * and rejections it leaves, and the device's acknowledgement. Every function
 * takes the tenant transaction; RLS scopes every statement.
 */

/** A row's identity in the receipts: its wire table name and its id. */
export interface ReceiptKey {
  readonly table: string;
  readonly rowId: string;
}

/** The seq a row was accepted at, and the version accepted (ISO-8601). */
export interface ReceiptRow {
  readonly tableName: string;
  readonly rowId: string;
  readonly seq: number;
  readonly rowUpdatedAt: string;
}

/**
 * The receipt lookup for these rows, as one statement. Each key probes the
 * primary key on **(business_id, table_name, row_id)** — the LATERAL join makes
 * that the plan whatever the tenant's size. Matching on the id alone misses the
 * key and scans every receipt the tenant has (the trap the DB2 audit's first
 * batched attempt fell into, at 86% CPU).
 */
export function receiptsQuery(businessId: string, keys: readonly ReceiptKey[]): SQL {
  const tables = textArray(keys.map((k) => k.table));
  const ids = textArray(keys.map((k) => k.rowId));
  return sql`
    SELECT r.table_name, r.row_id, r.seq, r.row_updated_at
    FROM unnest(${tables}, ${ids}) AS k(t, id)
    CROSS JOIN LATERAL (
      SELECT table_name, row_id, seq, row_updated_at FROM ${syncReceipts}
      WHERE business_id = ${businessId} AND table_name = k.t AND row_id = k.id
    ) r`;
}

/** The receipts of these rows. Parsed, not cast: `seq` is a bigint the driver sends as text. */
export async function receiptsOf(
  tx: Tx,
  businessId: string,
  keys: readonly ReceiptKey[],
): Promise<ReceiptRow[]> {
  if (keys.length === 0) return [];
  const rows = await tx.execute<Record<string, unknown>>(receiptsQuery(businessId, keys));
  return rows.map((r) => ({
    tableName: String(r['table_name']),
    rowId: String(r['row_id']),
    seq: parseSeq(r['seq']),
    rowUpdatedAt: new Date(String(r['row_updated_at'])).toISOString(),
  }));
}

function parseSeq(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(String(value));
  if (!Number.isSafeInteger(n) || n < 1)
    throw new RangeError(`sync_receipts.seq: ${String(value)}`);
  return n;
}

/** Remember the seq each row was accepted at. A row pushed again moves its receipt. */
export async function saveReceipts(
  tx: Tx,
  businessId: string,
  deviceId: string,
  receipts: readonly ReceiptRow[],
): Promise<void> {
  if (receipts.length === 0) return;
  const receivedAt = new Date().toISOString();
  await tx
    .insert(syncReceipts)
    .values(receipts.map((r) => ({ ...r, businessId, deviceId, receivedAt })))
    .onConflictDoUpdate({
      target: [syncReceipts.businessId, syncReceipts.tableName, syncReceipts.rowId],
      set: {
        seq: excluded(syncReceipts.seq),
        deviceId: excluded(syncReceipts.deviceId),
        rowUpdatedAt: excluded(syncReceipts.rowUpdatedAt),
        receivedAt: excluded(syncReceipts.receivedAt),
      },
    });
}

/**
 * Record what the device may purge through and when it last pushed, and return
 * the tenant's cursor. The two statements are sent together — postgres.js
 * pipelines them on the transaction's connection — so this is one round trip.
 */
export async function finishPush(
  tx: Tx,
  deviceId: string,
  acknowledgedThrough: number,
): Promise<number> {
  const [, cursor] = await Promise.all([
    tx
      .update(devices)
      .set({
        acknowledgedThrough: sql`GREATEST(${devices.acknowledgedThrough}, ${acknowledgedThrough})`,
        lastPushAt: new Date().toISOString(),
      })
      .where(eq(devices.id, deviceId)),
    committedCursor(tx),
  ]);
  return cursor;
}
