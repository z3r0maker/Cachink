import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';
import { syncCursors, syncLog } from '../schema/sync.js';

/**
 * The per-tenant sync cursor (B-08, B-09; audit DB-SYNC-01).
 *
 * `allocateSeq` increments the tenant's counter row and so **holds its row lock
 * until the transaction ends**. A second writer for the same tenant waits, which
 * is the point: within a tenant, seqs commit in the order they were handed out.
 * `committedCursor` then reads the counter as last committed, so no in-flight
 * seq can ever be at or below a cursor a device was given.
 *
 * Every function takes the tenant transaction; RLS scopes every statement.
 */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Hand out the next seq for this tenant; the lock lasts until commit. */
export async function allocateSeq(tx: Tx, businessId: string): Promise<number> {
  const [row] = await tx
    .insert(syncCursors)
    .values({ businessId, lastSeq: 1 })
    .onConflictDoUpdate({
      target: syncCursors.businessId,
      set: { lastSeq: sql`${syncCursors.lastSeq} + 1` },
    })
    .returning({ seq: syncCursors.lastSeq });
  if (row === undefined) throw new Error('sync cursor allocation returned no row');
  return row.seq;
}

/** The highest seq whose transaction has committed. 0 for a tenant with none. */
export async function committedCursor(tx: Tx): Promise<number> {
  const [row] = await tx.select({ seq: syncCursors.lastSeq }).from(syncCursors);
  return row?.seq ?? 0;
}

/**
 * Tell the devices a DOWN or HYBRID row changed, at a fresh seq. Call it inside
 * the transaction of the write it describes, so neither can happen alone.
 */
export async function logChange(
  tx: Tx,
  businessId: string,
  tableName: string,
  rowId: string,
  op: 'insert' | 'update',
): Promise<number> {
  const seq = await allocateSeq(tx, businessId);
  const now = new Date().toISOString();
  await tx
    .insert(syncLog)
    .values({ seq, tableName, rowId, op, businessId, createdAt: now, updatedAt: now });
  return seq;
}
