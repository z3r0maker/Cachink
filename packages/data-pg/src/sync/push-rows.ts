import type { PushableTable, SyncedTable } from '@xangarro/contracts';
import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Tx } from './cursor.js';
import { clampRowClock, futureLimit } from './push-clock.js';
import { SYNCED_TABLES } from './tables.js';

/**
 * Pushed rows into their table, **one statement per table** (B-08; audit
 * DB2-SYNC-01; ADR-120).
 *
 * - An UP row is upserted, last write wins by the row's own clock: an older
 *   push keeps the newer row (`kept`). That clock is held to the server's
 *   (`push-clock.ts`, audit F-05 a): a timestamp from the future is stored as
 *   the server's time, and a row already stored in the future outvotes nobody.
 * - A HYBRID row is insert-only: one already here is `kept` as it is, with
 *   whatever the portal changed since.
 * - An id that exists in **another** business is invisible under RLS. An
 *   upsert still finds the conflict and Postgres refuses the whole statement
 *   with 42501 (audit DB-SYNC-05) — the caller narrows the batch down. An
 *   insert-only row just comes back unwritten and unseen: `invisible`.
 *
 * All rows or none: a failed statement throws, and the caller runs this inside
 * a savepoint (a write past the parameter budget is several statements in it). The ids must be distinct — Postgres refuses to upsert a row twice
 * in one command.
 */
export type RowWrite = 'written' | 'kept' | 'invisible';

type Row = Record<string, unknown>;
type SyncTable = PgTable & { id: AnyPgColumn; updatedAt: AnyPgColumn };

const tableOf = (table: SyncedTable) => SYNCED_TABLES[table] as unknown as SyncTable;
const idOf = (row: Row) => String(row['id']);

/** A text array as ONE parameter — `= ANY($1)`, not a list of 500 placeholders. */
export const textArray = (values: readonly string[]): SQL => sql`${sql.param([...values])}::text[]`;

/** `excluded.<column>`: the value an upsert tried to insert. */
export const excluded = (column: AnyPgColumn): SQL => sql`excluded.${sql.identifier(column.name)}`;

/** Which of `ids` this business can see in `table`. One statement. */
export async function existingIds(
  tx: Tx,
  table: SyncedTable,
  ids: readonly string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const t = tableOf(table);
  const rows = await tx
    .select({ id: t.id })
    .from(t)
    .where(sql`${t.id} = ANY(${textArray(ids)})`);
  return new Set(rows.map((r) => String(r.id)));
}

/**
 * Bind parameters one statement may carry: Postgres's limit is 65,535. The
 * widest push today is about 14,000 (caja_turnos × 500), so this only bites if
 * the push limit ever rises (audit DB3-L-07).
 */
export const PARAM_BUDGET = 65_000;

/** `rows` cut so no statement binds more than `budget` parameters at `columns` a row. */
export function chunkByParams<T>(rows: readonly T[], columns: number, budget: number): T[][] {
  const size = Math.max(1, Math.floor(budget / Math.max(1, columns)));
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

export interface WriteOptions {
  /**
   * The server's time for this write. Required, so no caller can store a
   * pushed row without holding its clock to it; tests pass a fixed one.
   */
  readonly now: Date;
  /** Bind parameters a statement may carry. Default {@link PARAM_BUDGET}. */
  readonly paramBudget?: number;
}

export async function writeSyncedRows(
  tx: Tx,
  table: PushableTable,
  pushed: readonly Row[],
  insertOnly: boolean,
  { now, paramBudget = PARAM_BUDGET }: WriteOptions,
): Promise<RowWrite[]> {
  const t = tableOf(table);
  const columns = Object.keys(getTableColumns(t)).length;
  const rows = pushed.map((row) => clampRowClock(row, now));
  const limit = futureLimit(now);
  const written = new Set<string>();
  for (const group of byShape(rows)) {
    for (const chunk of chunkByParams(group, columns, paramBudget)) {
      const ids = await (insertOnly ? insertNew(tx, t, chunk) : upsertNewer(tx, t, chunk, limit));
      for (const id of ids) written.add(id);
    }
  }
  const unwritten = rows.map(idOf).filter((id) => !written.has(id));
  const visible = await existingIds(tx, table, unwritten);
  return rows.map((row) => {
    const id = idOf(row);
    if (written.has(id)) return 'written';
    return visible.has(id) ? 'kept' : 'invisible';
  });
}

/**
 * Rows grouped by the fields they carry. A row that leaves a field out must
 * leave the stored value alone, so one `SET` list can only serve rows of one
 * shape. Rows of one table almost always share it: one group, one statement.
 */
function byShape(rows: readonly Row[]): Row[][] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const shape = fieldsOf(row).sort().join(',');
    const group = groups.get(shape);
    if (group === undefined) groups.set(shape, [row]);
    else group.push(row);
  }
  return [...groups.values()];
}

const fieldsOf = (row: Row) => Object.keys(row).filter((k) => row[k] !== undefined);

async function insertNew(tx: Tx, t: SyncTable, rows: readonly Row[]): Promise<string[]> {
  const out = await tx
    .insert(t)
    .values(rows as never)
    .onConflictDoNothing({ target: t.id })
    .returning({ id: t.id });
  return out.map((r) => String(r.id));
}

/**
 * The newer row wins. A stored `updated_at` past `futureLimit` is a clock from
 * before the clamp (or a forged one): it is not newer than anything, so the
 * pushed row replaces it and the row's clock is the server's again.
 */
async function upsertNewer(
  tx: Tx,
  t: SyncTable,
  rows: readonly Row[],
  futureLimit: string,
): Promise<string[]> {
  const columns = getTableColumns(t) as Record<string, AnyPgColumn>;
  const first = rows[0] ?? {};
  const set = Object.fromEntries(
    fieldsOf(first)
      .filter((k) => k !== 'id' && columns[k] !== undefined)
      .map((k) => [k, excluded(columns[k] as AnyPgColumn)]),
  );
  const out = await tx
    .insert(t)
    .values(rows as never)
    .onConflictDoUpdate({
      target: t.id,
      set: set as never,
      setWhere: sql`(${t.updatedAt} < excluded.updated_at OR ${t.updatedAt} > ${futureLimit}::timestamptz)`,
    })
    .returning({ id: t.id });
  return out.map((r) => String(r.id));
}
