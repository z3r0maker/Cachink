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
export function allocateSeq(tx: Tx, businessId: string): Promise<number> {
  return allocateSeqs(tx, businessId, 1);
}

/**
 * Hand out `n` consecutive seqs in **one** statement and return the first
 * (audit DB2-SYNC-01; ADR-119 — the "block of seqs per batch" ADR-078
 * anticipated). Same lock, same commit-order guarantee as one at a time; a
 * push holds it for one round trip instead of one per row.
 */
export async function allocateSeqs(tx: Tx, businessId: string, n: number): Promise<number> {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError(`allocateSeqs: n=${n}`);
  const [row] = await tx
    .insert(syncCursors)
    .values({ businessId, lastSeq: n })
    .onConflictDoUpdate({
      target: syncCursors.businessId,
      set: { lastSeq: sql`${syncCursors.lastSeq} + ${n}::bigint` },
    })
    .returning({ seq: syncCursors.lastSeq });
  if (row === undefined) throw new Error('sync cursor allocation returned no row');
  return row.seq - n + 1;
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
  await logChanges(tx, businessId, [{ seq, tableName, rowId, op }]);
  return seq;
}

/** One `sync_log` entry, at a seq the caller already took. */
export interface LogEntry {
  readonly seq: number;
  readonly tableName: string;
  readonly rowId: string;
  readonly op: 'insert' | 'update';
}

/**
 * Log several changes in one statement, at seqs taken with `allocateSeqs` in the
 * same transaction. Nothing to log is not an error.
 */
export async function logChanges(
  tx: Tx,
  businessId: string,
  entries: readonly LogEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const now = new Date().toISOString();
  await tx
    .insert(syncLog)
    .values(entries.map((e) => ({ ...e, businessId, createdAt: now, updatedAt: now })));
}
