/**
 * Adopt the pre-rebrand observability log table (ADR-056).
 *
 * This package creates its own table with `CREATE TABLE IF NOT EXISTS`, so
 * the rename can't live in a data migration: the table may not exist yet.
 * Every path that creates the table calls this first. Renaming keeps every
 * row, including the audit hash chain.
 */

import { TABLE, type SqliteDatabase } from './sqlite-log-store-sql.js';

/** Legacy table name — kept only to upgrade pre-rebrand installs. */
export const LEGACY_TABLE = '__cachink_observability_log';

async function tableExists(db: SqliteDatabase, name: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [name],
  );
  return (row?.cnt ?? 0) > 0;
}

/** Rename the legacy log table when it exists and the current one does not. */
export async function adoptLegacyLogTable(db: SqliteDatabase): Promise<void> {
  if (!(await tableExists(db, LEGACY_TABLE)) || (await tableExists(db, TABLE))) return;
  await db.execAsync(`ALTER TABLE ${LEGACY_TABLE} RENAME TO ${TABLE}`);
}
