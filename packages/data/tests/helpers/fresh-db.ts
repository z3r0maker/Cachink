/**
 * makeFreshDb() — spin up an in-memory SQLite via `better-sqlite3`, apply
 * the committed migrations, and return a Drizzle handle typed as the
 * driver-agnostic {@link CachinkDatabase} so test files can share the same
 * repo impls they'd use in production.
 *
 * Every call returns a brand-new database, isolated from every other
 * test — there's no sharing, no cleanup, no cross-test leakage.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as schema from '../../src/schema/index.js';
import type { CachinkDatabase } from '../../src/repositories/drizzle/_db.js';

const MIGRATIONS_FOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../drizzle/migrations',
);

export function makeFreshDb(): CachinkDatabase {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as CachinkDatabase;
}
