/**
 * Migrations bundle for `@cachink/data` (P1C-M2-T02 infra).
 *
 * Exposed as the `./migrations` subpath export in package.json so both
 * Metro (mobile) and Vite (desktop) can import the journal + SQL strings
 * without depending on filesystem access or a Drizzle-Kit runtime.
 *
 * Why inline the SQL instead of reading the `.sql` files at runtime:
 *   - Metro has no default `.sql` asset resolver. Shipping the SQL as a
 *     TS string sidesteps Metro config changes entirely.
 *   - Vite could import `?raw`, but splitting bundler behaviour by
 *     platform complicates testing. One TS module works everywhere.
 *
 * When Drizzle Kit emits the next migration:
 *   1. Create `migration-000N.ts` next to this file with the raw SQL.
 *   2. Add the import + a matching `m000N` entry in the `migrations` record.
 *   3. The `_journal.json` import is already live — Drizzle Kit updates
 *      that file automatically.
 *
 * Apps call `runMigrations(db)` from `@cachink/ui/database` once at
 * first launch.
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
 *
 * Shape matches what `drizzle-orm/*-sqlite/migrator`'s `migrate()` accepts,
 * so we can adopt the first-party migrator later without changing callers.
 * For Phase 1C we apply migrations via our own `runMigrations` helper
 * (see `@cachink/ui/database`) so the same code path works on Metro, Vite,
 * and `better-sqlite3` (tests).
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
