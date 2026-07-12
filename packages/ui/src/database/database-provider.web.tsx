/**
 * DatabaseProvider — desktop (Tauri) variant.
 *
 * Vite resolves this file for the Tauri webview (via the shared
 * `database-provider.tsx`'s re-export). Metro picks `.native.tsx` on
 * mobile and never loads this file.
 *
 * Wiring:
 *   1. `@tauri-apps/plugin-sql`'s `Database.load('sqlite:cachink.db')`
 *      opens the SQLite file under the app's sandboxed data directory
 *      (resolved by Tauri from `BaseDirectory::App`).
 *   2. Drizzle's `sqlite-proxy` driver adapts the plugin's
 *      object-returning API onto the column-value-array shape Drizzle
 *      internals expect. One ~40-line callback keeps the rest of the
 *      Drizzle surface identical on both platforms.
 *   3. `runMigrations` applies any pending migrations from
 *      `@cachink/data/migrations` — same code path as the mobile variant.
 *
 * Important cross-driver quirk: Tauri's plugin returns `select` rows as
 * objects (`Array<Record<string, unknown>>`), but the sqlite-proxy contract
 * expects each row as an ordered array of column values. `Object.values`
 * preserves insertion order for plain objects on every modern JS engine,
 * and SQLite drivers emit columns in SELECT order, so the projection is
 * deterministic. Drizzle's row-mapper then rebuilds the named shape using
 * its own column metadata.
 */

import { useCallback, type ReactElement } from 'react';
import Database from '@tauri-apps/plugin-sql';
import { drizzle, type AsyncRemoteCallback } from 'drizzle-orm/sqlite-proxy';
import type { SqliteDatabase } from '@cachink/observability';
import * as schema from '@cachink/data/schema';
import type { CachinkDatabase } from '@cachink/data';
import {
  AsyncDatabaseProvider,
  type DatabaseProviderProps,
  type AsyncDatabaseProviderProps,
} from './_internal';
import { webResetDatabase } from './database-reset.web';
import { runMigrations } from './run-migrations';
import {
  getSchemaVersion,
  setSchemaVersion,
  checkSchemaCompatibility,
  SCHEMA_VERSION,
  SchemaVersionError,
} from '@cachink/data/migrator';

/** Tauri-plugin-sql path prefix — mandatory per the plugin docs. */
const DB_PATH = 'sqlite:cachink.db';

/** Adapt Tauri's Database to the SqliteDatabase interface for observability. */
function wrapTauriAsSqliteDatabase(tauriDb: Database): SqliteDatabase {
  return {
    async execAsync(sqlText: string) {
      await tauriDb.execute(sqlText);
    },
    async runAsync(sqlText: string, params: unknown[]) {
      await tauriDb.execute(sqlText, params);
    },
    async getAllAsync<T>(sqlText: string, params?: unknown[]): Promise<T[]> {
      return tauriDb.select<T[]>(sqlText, params ?? []);
    },
    async getFirstAsync<T>(sqlText: string, params?: unknown[]): Promise<T | null> {
      const rows = await tauriDb.select<T[]>(sqlText, params ?? []);
      return rows[0] ?? null;
    },
  };
}

/** Build the Drizzle sqlite-proxy callback that bridges to Tauri's plugin. */
export function buildTauriCallback(tauriDb: Database): AsyncRemoteCallback {
  return async (sqlText, params, method) => {
    if (method === 'run') {
      try {
        await tauriDb.execute(sqlText, params);
      } catch (err) {
        console.error('[TAURI execute FAILED]', {
          sql: sqlText.slice(0, 200),
          params,
          err: String(err),
          msg: err instanceof Error ? err.message : '?',
        });
        throw err;
      }
      return { rows: [] };
    }

    const rows = await tauriDb.select<Array<Record<string, unknown>>>(sqlText, params);

    if (method === 'get') {
      const first = rows[0];
      return { rows: first ? Object.values(first) : [] };
    }

    // method is 'all' or 'values' — return row-arrays.
    return { rows: rows.map((row) => Object.values(row)) };
  };
}

async function createDesktopDatabase(): Promise<CachinkDatabase> {
  const tauriDb = await Database.load(DB_PATH);
  try {
    // Enable FK enforcement before migrations run.
    // Must happen outside any transaction — pragma is a no-op inside one.
    await tauriDb.execute('PRAGMA foreign_keys = ON');
    await tauriDb.execute('PRAGMA journal_mode = WAL');
    const db = drizzle(buildTauriCallback(tauriDb), { schema }) as unknown as CachinkDatabase;
    // Attach a SqliteDatabase-compatible handle so the observability bridge
    // (which reads `db.$client`) can use it for its log store.
    (db as unknown as { $client: SqliteDatabase }).$client = wrapTauriAsSqliteDatabase(tauriDb);

    // Version gate: prevent old code from running against a newer schema.
    const dbVersion = await getSchemaVersion(db);
    const compat = checkSchemaCompatibility(dbVersion, SCHEMA_VERSION);

    switch (compat.status) {
      case 'ok':
        return db;
      case 'needs_migration':
        await runMigrations(db, { skipTransactions: true });
        await setSchemaVersion(db, SCHEMA_VERSION);
        return db;
      case 'app_too_old':
        throw new SchemaVersionError(compat.dbVersion, compat.appVersion);
    }
  } catch (error) {
    await tauriDb.close().catch(() => false);
    throw error;
  }
}

export function DatabaseProvider(props: DatabaseProviderProps): ReactElement | null {
  // Memoize so AsyncDatabaseProvider's useEffect dep array stays stable.
  const create = useCallback(createDesktopDatabase, []);
  const asyncProps: AsyncDatabaseProviderProps = {
    children: props.children,
    database: props.database,
    create,
    reset: webResetDatabase,
  };
  return <AsyncDatabaseProvider {...asyncProps} />;
}
