/**
 * Spin up a fresh in-memory SQLite with the complete Cachink schema.
 * Uses the same migration SQL as `@cachink/data`'s test harness and
 * the production runner — single source of truth.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@cachink/data/schema';
import type { CachinkDatabase } from '@cachink/data';
import { migration0000Sql } from '@cachink/data/migrations';
import { splitStatements, SCHEMA_VERSION } from '@cachink/data/migrator';

export function makeFreshDb(): CachinkDatabase {
  const sqlite = new Database(':memory:');

  // Disable FK enforcement in sync tests — these tests validate sync
  // logic (push/pull/LWW), not referential integrity. FK enforcement
  // is tested in packages/data/tests/migrations/fk-enforcement.test.ts.
  // better-sqlite3 compiles SQLite with SQLITE_DEFAULT_FOREIGN_KEYS=1.
  sqlite.pragma('foreign_keys = OFF');

  for (const stmt of splitStatements(migration0000Sql)) {
    sqlite.exec(stmt);
  }

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
