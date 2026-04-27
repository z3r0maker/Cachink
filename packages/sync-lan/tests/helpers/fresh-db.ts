/**
 * Spin up a fresh in-memory SQLite with all Phase 1B tables + the Phase 1D
 * sync infrastructure migration applied. Mirrors `@cachink/data`'s own
 * test harness but lives inside `@cachink/sync-lan` so this package's
 * tests don't pull `packages/data/tests` into their scope.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as schema from '@cachink/data/schema';
import type { CachinkDatabase } from '@cachink/data';

const MIGRATIONS_FOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/drizzle/migrations',
);

export function makeFreshDb(): CachinkDatabase {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as CachinkDatabase;
}
