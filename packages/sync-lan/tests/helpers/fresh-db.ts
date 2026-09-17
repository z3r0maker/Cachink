/**
 * Spin up a fresh in-memory SQLite with the complete Xangarro schema.
 * Uses the same migration SQL as `@xangarro/data`'s test harness and
 * the production runner — single source of truth.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@xangarro/data/schema';
import type { XangarroDatabase } from '@xangarro/data';
import { journal, migrationSqlByTag } from '@xangarro/data/migrations';
import { splitStatements, SCHEMA_VERSION } from '@xangarro/data/migrator';

export function makeFreshDb(): XangarroDatabase {
  const sqlite = new Database(':memory:');

  // Disable FK enforcement in sync tests — these tests validate sync
  // logic (push/pull/LWW), not referential integrity. FK enforcement
  // is tested in packages/data/tests/migrations/fk-enforcement.test.ts.
  // better-sqlite3 compiles SQLite with SQLITE_DEFAULT_FOREIGN_KEYS=1.
  sqlite.pragma('foreign_keys = OFF');

  for (const entry of journal.entries) {
    for (const stmt of splitStatements(migrationSqlByTag[entry.tag] ?? '')) {
      sqlite.exec(stmt);
    }
  }

  sqlite.exec(
    `CREATE TABLE IF NOT EXISTS __xangarro_migrations (
      tag TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    )`,
  );
  sqlite.exec(
    `INSERT INTO __xangarro_migrations (tag, applied_at)
     SELECT value, datetime('now') FROM json_each('${JSON.stringify(journal.entries.map((e) => e.tag))}')`,
  );
  sqlite.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  const db = drizzle(sqlite, { schema });
  return db as unknown as XangarroDatabase;
}
