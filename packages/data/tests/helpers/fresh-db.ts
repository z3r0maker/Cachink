/**
 * makeFreshDb() — spin up an in-memory SQLite via `better-sqlite3`, apply
 * the committed migrations, and return a Drizzle handle typed as the
 * driver-agnostic {@link CachinkDatabase} so test files can share the same
 * repo impls they'd use in production.
 *
 * Every call returns a brand-new database, isolated from every other
 * test — there's no sharing, no cleanup, no cross-test leakage.
 *
 * Uses the SAME migration SQL and statement-splitting logic that the
 * async `runMigrations()` runner uses in production, but executes it
 * synchronously via `better-sqlite3`'s `exec()` to keep all 22+ test
 * factories synchronous. The invariant "same SQL, same schema" holds.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/schema/index.js';
import type { CachinkDatabase } from '../../src/repositories/drizzle/_db.js';
import { migration0000Sql } from '../../drizzle/migrations/0000_initial.js';
import { splitStatements } from '../../src/migrator/split-statements.js';
import { SCHEMA_VERSION } from '../../src/migrator/schema-version.js';

export function makeFreshDb(): CachinkDatabase {
  const sqlite = new Database(':memory:');

  // Disable FK enforcement in contract tests — repositories test CRUD
  // logic, not referential integrity. FK enforcement is tested in
  // fk-enforcement.test.ts; production apps enable FKs via their
  // database providers (database-provider.native.tsx / .web.tsx).
  // better-sqlite3 compiles SQLite with SQLITE_DEFAULT_FOREIGN_KEYS=1,
  // so we must explicitly turn it off here.
  sqlite.pragma('foreign_keys = OFF');

  // Apply the same migration SQL the async runner uses, but via
  // better-sqlite3's synchronous exec() to keep test factories sync.
  for (const stmt of splitStatements(migration0000Sql)) {
    sqlite.exec(stmt);
  }

  // Bookkeeping: match what runMigrations() would create.
  sqlite.exec(
    `CREATE TABLE IF NOT EXISTS __cachink_migrations (
      tag TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    )`,
  );
  sqlite.exec(
    `INSERT INTO __cachink_migrations (tag, applied_at)
     VALUES ('0000_initial', datetime('now'))`,
  );
  sqlite.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  const db = drizzle(sqlite, { schema });
  return db as unknown as CachinkDatabase;
}
