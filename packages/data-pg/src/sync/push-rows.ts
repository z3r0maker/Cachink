import type { PushableTable, SyncedTable } from '@xangarro/contracts';
import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Tx } from './cursor.js';
import { SYNCED_TABLES } from './tables.js';

/**
 * Pushed rows into their table, **one statement per table** (B-08; audit
 * DB2-SYNC-01; ADR-116).
 *
 * - An UP row is upserted, last write wins by the row's own clock: an older
 *   push keeps the newer row (`kept`).
 * - A HYBRID row is insert-only: one already here is `kept` as it is, with
 *   whatever the portal changed since.
 * - An id that exists in **another** business is invisible under RLS. An
 *   upsert still finds the conflict and Postgres refuses the whole statement
 *   with 42501 (audit DB-SYNC-05) — the caller narrows the batch down. An
 *   insert-only row just comes back unwritten and unseen: `invisible`.
 *
 * All rows or none: a failed statement throws, and the caller runs this inside
 * a savepoint. The ids must be distinct — Postgres refuses to upsert a row twice
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

export async function writeSyncedRows(
  tx: Tx,
  table: PushableTable,
  rows: readonly Row[],
  insertOnly: boolean,
): Promise<RowWrite[]> {
  const t = tableOf(table);
  const written = new Set<string>();
  for (const group of byShape(rows)) {
    const ids = insertOnly ? await insertNew(tx, t, group) : await upsertNewer(tx, t, group);
    for (const id of ids) written.add(id);
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

async function upsertNewer(tx: Tx, t: SyncTable, rows: readonly Row[]): Promise<string[]> {
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
      setWhere: sql`${t.updatedAt} < excluded.updated_at`,
    })
    .returning({ id: t.id });
  return out.map((r) => String(r.id));
}
