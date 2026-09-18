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
import { journal, migrationSqlByTag } from '../../drizzle/migrations/index.js';
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

  // Apply every committed migration, in journal order — the same SQL the
  // async runner uses, via better-sqlite3's synchronous exec() to keep test
  // factories sync. (This used to apply 0000 alone; it went unnoticed until
  // the first new migration, P-08's fiscal columns.)
  const tags = journal.entries.map((e) => e.tag);
  for (const tag of tags) {
    for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) sqlite.exec(stmt);
  }

  // Bookkeeping: match what runMigrations() would create.
  sqlite.exec(
    `CREATE TABLE IF NOT EXISTS __cachink_migrations (
      tag TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    )`,
  );
  const record = sqlite.prepare(
    `INSERT INTO __cachink_migrations (tag, applied_at) VALUES (?, datetime('now'))`,
  );
  for (const tag of tags) record.run(tag);
  sqlite.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  const db = drizzle(sqlite, { schema });
  return db as unknown as CachinkDatabase;
}
