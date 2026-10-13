/**
 * Schema version gate — uses SQLite's `PRAGMA user_version` to track
 * the current schema epoch and prevent old code from running against
 * a newer schema.
 *
 * `PRAGMA user_version` stores a single integer in the SQLite file
 * header. It's atomic, readable without opening a transaction, and
 * visible in every SQLite tool (`sqlite3` CLI, DB Browser).
 *
 * Increment {@link SCHEMA_VERSION} whenever a new migration ships.
 * Its value must always equal the number of entries in `_journal.json`.
 */

import { sql } from 'drizzle-orm';
import type { XangarroDatabase } from '../repositories/drizzle/_db.js';
import type { RawRow } from './raw-row.js';

/**
 * Current schema version. Must match the number of entries in
 * `_journal.json`. After consolidation this starts at 1.
 */
export const SCHEMA_VERSION = 14;

/**
 * Reads with `all`, not `get`: Drizzle's expo driver steps a `get` once and
 * never resets it, and that open read makes a later `DROP TABLE` in a
 * migration fail with «database table is locked» (M-11).
 */
export async function getSchemaVersion(db: XangarroDatabase): Promise<number> {
  const rows = (await db.all(sql.raw('PRAGMA user_version'))) as RawRow[];
  const row = rows[0];
  if (row === undefined) return 0;
  const value = Array.isArray(row)
    ? row[0]
    : (row as Readonly<Record<string, unknown>>).user_version;
  return typeof value === 'number' ? value : 0;
}

export async function setSchemaVersion(db: XangarroDatabase, version: number): Promise<void> {
  await db.run(sql.raw(`PRAGMA user_version = ${version}`));
}

export type VersionCheckResult =
  | { status: 'ok' }
  | { status: 'needs_migration' }
  | { status: 'app_too_old'; dbVersion: number; appVersion: number };

export function checkSchemaCompatibility(
  dbVersion: number,
  appSchemaVersion: number,
): VersionCheckResult {
  if (dbVersion === appSchemaVersion) return { status: 'ok' };
  if (dbVersion < appSchemaVersion) return { status: 'needs_migration' };
  return { status: 'app_too_old', dbVersion, appVersion: appSchemaVersion };
}
