/**
 * Write pulled rows a batch per statement (audit DB3-BOOT-01's device half).
 *
 * A snapshot page holds thousands of movements. One awaited upsert per row
 * made the page thousands of round trips to the phone's SQLite (40,000 rows:
 * 2.6 s on a laptop, far longer on a low-end Android). Rows are grouped by the
 * columns they carry, so a row that omits a column never overwrites it, and
 * cut so no statement binds more than {@link MAX_VARIABLES}.
 */

import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { XangarroDatabase } from '@xangarro/data';

/** SQLite before 3.32, still on older Android, binds at most 999 variables. */
export const MAX_VARIABLES = 999;

type Values = Record<string, unknown>;

/** Keep only the table's columns; JSON-encode structured values. */
export function toColumnValues(table: SQLiteTable, row: Readonly<Values>): Values {
  const columns = getTableColumns(table);
  const out: Values = {};
  for (const key of Object.keys(columns)) {
    if (!(key in row)) continue;
    const value = row[key];
    const structured = value !== null && typeof value === 'object';
    out[key] = structured ? JSON.stringify(value) : value;
  }
  return out;
}

/** Rows grouped by the columns they carry (first-seen order), cut to the variable budget. */
export function upsertBatches(rows: readonly Values[]): Values[][] {
  const groups = new Map<string, Values[]>();
  for (const row of rows) {
    const key = Object.keys(row).join('\u0000');
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  const batches: Values[][] = [];
  for (const group of groups.values()) {
    const width = Math.max(1, Object.keys(group[0] ?? {}).length);
    const size = Math.max(1, Math.floor(MAX_VARIABLES / width));
    for (let i = 0; i < group.length; i += size) batches.push(group.slice(i, i + size));
  }
  return batches;
}

/** Insert `rows`, updating on an existing id only the columns each row carries. */
export async function upsertRows(
  db: XangarroDatabase,
  table: SQLiteTable,
  rows: readonly Readonly<Values>[],
): Promise<void> {
  const columns = getTableColumns(table);
  const idColumn = columns['id'];
  if (!idColumn) throw new TypeError('reference table has no id column');
  // A row sent twice in one page keeps its last copy, as one upsert per row did.
  const latest = new Map(rows.map((r) => [String(r['id']), toColumnValues(table, r)]));
  for (const batch of upsertBatches([...latest.values()])) {
    const set: Record<string, SQL> = {};
    for (const key of Object.keys(batch[0] ?? {})) {
      const column = columns[key];
      if (key !== 'id' && column) set[key] = sql.raw(`excluded."${column.name}"`);
    }
    await db.insert(table).values(batch).onConflictDoUpdate({ target: idColumn, set }).run();
  }
}
