import { newUlid } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import { syncRejections } from '../schema/sync.js';
import type { Tx } from './cursor.js';
import type { ReceiptKey } from './push.js';
import { excluded, textArray } from './push-rows.js';

/**
 * The rows a push refused, as the portal keeps them for the owner (ADR-053 Q4;
 * ADR-119): one open rejection per device and row, which a later answer
 * replaces and a later acceptance closes.
 */

/** A rejected row as the portal keeps it; `payload` is JSON text, or null to keep none. */
export interface RejectionRow {
  readonly tableName: string;
  readonly rowId: string;
  readonly clientSeq: number;
  readonly code: string;
  readonly message: string;
  readonly payload: string | null;
}

/**
 * Keep a push's rejections, in one statement. A retry of the same row updates
 * its rejection rather than adding one — and so does the same row twice in one
 * push, where the later answer wins, as it did one row at a time.
 */
export async function saveRejections(
  tx: Tx,
  businessId: string,
  deviceId: string,
  rejections: readonly RejectionRow[],
): Promise<void> {
  const latest = new Map(rejections.map((r) => [`${r.tableName}/${r.rowId}`, r]));
  if (latest.size === 0) return;
  const now = new Date().toISOString();
  await tx
    .insert(syncRejections)
    .values(
      [...latest.values()].map(({ payload, ...r }) => ({
        ...r,
        payload: payload === null ? null : sql`${payload}::jsonb`,
        id: newUlid(),
        businessId,
        deviceId,
        receivedAt: now,
        resolvedAt: null,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({ target: REJECTION_KEY, set: REJECTION_UPDATE });
}

const REJECTION_KEY = [
  syncRejections.businessId,
  syncRejections.deviceId,
  syncRejections.tableName,
  syncRejections.rowId,
];

/** A retried row's rejection takes the new answer and is open again. */
const REJECTION_UPDATE = {
  code: excluded(syncRejections.code),
  message: excluded(syncRejections.message),
  clientSeq: excluded(syncRejections.clientSeq),
  payload: excluded(syncRejections.payload),
  receivedAt: excluded(syncRejections.receivedAt),
  resolvedAt: sql`NULL`,
  updatedAt: excluded(syncRejections.updatedAt),
};

/**
 * Close this device's open rejections of rows it has now had accepted — an
 * INTERNAL one whose retry went through, most often — so the portal's count
 * and the staff digest stop counting them (audit DB3-SYNC-04). One statement
 * for the batch, on the rejections' unique key; the caller pipelines it with
 * the receipts insert.
 */
export async function resolveRejections(
  tx: Tx,
  businessId: string,
  deviceId: string,
  keys: readonly ReceiptKey[],
): Promise<void> {
  if (keys.length === 0) return;
  const now = new Date().toISOString();
  await tx.execute(sql`
    UPDATE ${syncRejections} AS r SET resolved_at = ${now}, updated_at = ${now}
    FROM unnest(${textArray(keys.map((k) => k.table))}, ${textArray(keys.map((k) => k.rowId))})
      AS k(t, id)
    WHERE r.business_id = ${businessId} AND r.device_id = ${deviceId}
      AND r.table_name = k.t AND r.row_id = k.id AND r.resolved_at IS NULL`);
}
