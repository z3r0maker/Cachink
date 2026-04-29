/**
 * Migrations bundle for `@cachink/data` (P1C-M2-T02 infra).
 *
 * Exposed as the `./migrations` subpath export in package.json so both
 * Metro (mobile) and Vite (desktop) can import the journal + SQL strings
 * without depending on filesystem access or a Drizzle-Kit runtime.
 *
 * Since the app hasn't shipped publicly, migration 0000 contains the
 * complete schema (including UXD-R3 smart catalog columns and ADR-048
 * productoId NOT NULL). No incremental ALTER TABLE migrations are needed.
 */

import journal from './meta/_journal.json';
import { migration0000Sql } from './migration-0000.js';
import { migration0001Sql } from './migration-0001.js';

/**
 * Map of migration tag → raw SQL. Keys match `_journal.json` entry tags.
 * Used by `runMigrations()` to execute missing migrations in order.
 */
export const migrationSqlByTag: Readonly<Record<string, string>> = Object.freeze({
  '0000_lying_johnny_blaze': migration0000Sql,
  '0001_change_log_and_sync_state': migration0001Sql,
});

/**
 * Drizzle-style migrations bundle.
 */
export const migrationsBundle = Object.freeze({
  journal,
  migrations: Object.freeze({
    m0000: migration0000Sql,
    m0001: migration0001Sql,
  }),
});

export { journal, migration0000Sql, migration0001Sql };
export default migrationsBundle;
