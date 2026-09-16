/**
 * applyReferenceTables — writes cloud-authoritative reference rows (the
 * DOWN + HYBRID tables of docs/plan/02-contracts.md §8) into the local
 * SQLite database. Used by activation bootstrap (A-04) and every pull (A-06).
 *
 * The server is authoritative for these tables, so this is a plain upsert by
 * `id` — no last-write-wins. Rows arrive as domain entities (camelCase,
 * bigint money); Drizzle maps them to snake_case columns. Keys the local
 * table does not have yet are dropped, and structured values (arrays,
 * records) are JSON-encoded, matching how the repositories store them.
 */

import { eq, getTableColumns } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { ReferenceTables } from '@xangarro/contracts';
import type { CachinkDatabase } from '@xangarro/data';
import {
  businesses,
  clients,
  conversionRecetas,
  employees,
  products,
  recurringExpenses,
  users,
} from '@xangarro/data';

type RefTableName = Exclude<keyof ReferenceTables, 'feature_flags'>;

const TABLES: Record<RefTableName, SQLiteTable> = {
  businesses,
  products,
  clients,
  users,
  employees,
  recurring_expenses: recurringExpenses,
  conversion_recetas: conversionRecetas,
};

/** Order matters for foreign keys: parents before children. */
const APPLY_ORDER: readonly RefTableName[] = [
  'businesses',
  'users',
  'employees',
  'products',
  'clients',
  'recurring_expenses',
  'conversion_recetas',
];

export interface ApplyReferenceResult {
  readonly applied: Readonly<Record<RefTableName, number>>;
}

/** Keep only the table's columns; JSON-encode structured values. */
export function toColumnValues(
  table: SQLiteTable,
  row: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const columns = getTableColumns(table);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(columns)) {
    if (!(key in row)) continue;
    const value = row[key];
    const structured = value !== null && typeof value === 'object';
    out[key] = structured ? JSON.stringify(value) : value;
  }
  return out;
}

async function upsertRow(
  db: CachinkDatabase,
  table: SQLiteTable,
  row: Readonly<Record<string, unknown>>,
): Promise<void> {
  const values = toColumnValues(table, row);
  const { id: _id, ...set } = values;
  const idColumn = getTableColumns(table)['id'];
  if (!idColumn) throw new TypeError('reference table has no id column');
  await db.insert(table).values(values).onConflictDoUpdate({ target: idColumn, set }).run();
}

/**
 * Apply every reference table, then store the tenant feature-flag layer on
 * the business row (`useFeatureFlags` reads `businesses.feature_flags`).
 */
export async function applyReferenceTables(
  db: CachinkDatabase,
  tables: ReferenceTables,
  businessId: string,
): Promise<ApplyReferenceResult> {
  const applied = {} as Record<RefTableName, number>;
  for (const name of APPLY_ORDER) {
    const rows = tables[name] as readonly Record<string, unknown>[];
    for (const row of rows) await upsertRow(db, TABLES[name], row);
    applied[name] = rows.length;
  }
  const flags = JSON.stringify(tables.feature_flags);
  await db
    .update(businesses)
    .set({ featureFlags: flags })
    .where(eq(businesses.id, businessId))
    .run();
  return { applied };
}
