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
import type { CachinkDatabase } from '../repositories/drizzle/_db.js';

/**
 * Current schema version. Must match the number of entries in
 * `_journal.json`. After consolidation this starts at 1.
 */
export const SCHEMA_VERSION = 1;

export async function getSchemaVersion(db: CachinkDatabase): Promise<number> {
  const result = await db.get(sql.raw('PRAGMA user_version'));
  return (result as { user_version: number } | undefined)?.user_version ?? 0;
}

export async function setSchemaVersion(
  db: CachinkDatabase,
  version: number,
): Promise<void> {
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
