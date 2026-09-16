/**
 * Reads the next slice of the change log and coalesces it per row (A-06):
 * three local edits to one sale become one delta carrying the latest state.
 * A row inserted and then edited before it ever left the phone stays an
 * `insert` — the server has never seen it, and hybrid tables reject updates.
 */

import { sql } from 'drizzle-orm';
import { MAX_PUSH_DELTAS, isPushable, type DeltaOp } from '@xangarro/contracts';
import type { CachinkDatabase } from '@xangarro/data';
import { rowKey } from './table-map.js';

export interface ChangeEntry {
  readonly id: number;
  readonly tableName: string;
  readonly rowId: string;
  readonly op: DeltaOp;
}

export interface CoalescedChange {
  readonly tableName: string;
  readonly rowId: string;
  readonly op: DeltaOp;
}

export async function readChangeSlice(
  db: CachinkDatabase,
  afterId: number,
  limit: number = MAX_PUSH_DELTAS,
): Promise<readonly ChangeEntry[]> {
  return (await db.all(
    sql`SELECT id, table_name AS tableName, row_id AS rowId, op
        FROM __cachink_change_log WHERE id > ${afterId} ORDER BY id ASC LIMIT ${limit}`,
  )) as ChangeEntry[];
}

/**
 * One change per row; `insert` wins over later `update`s. Tables outside the
 * push scope (DOWN tables, local-only tables) and hybrid updates are dropped
 * here, so they can never be sent.
 */
export function coalesce(entries: readonly ChangeEntry[]): readonly CoalescedChange[] {
  const byRow = new Map<string, CoalescedChange>();
  for (const e of entries) {
    const key = rowKey(e.tableName, e.rowId);
    const prev = byRow.get(key);
    const op: DeltaOp = prev?.op === 'insert' || e.op === 'insert' ? 'insert' : 'update';
    byRow.set(key, { tableName: e.tableName, rowId: e.rowId, op });
  }
  return [...byRow.values()].filter((c) => isPushable(c.tableName, c.op));
}
