/**
 * Unit tests for the desktop (Tauri) DatabaseProvider variant (P1C Commit 2).
 *
 * We can't boot a real Tauri webview in Vitest, but the only non-trivial
 * piece the desktop provider adds is `buildTauriCallback` — the adapter
 * that bridges `@tauri-apps/plugin-sql`'s object-row API onto Drizzle's
 * sqlite-proxy column-value-array contract. We test it against a
 * better-sqlite3 in-memory database with a thin stub over the Tauri
 * `Database` interface so the adapter logic runs against real SQL.
 *
 * This covers:
 *   - `run` method executes DDL/DML and doesn't leak row data.
 *   - `all` / `values` methods return arrays of column-value arrays.
 *   - `get` method returns a single row as column values, or an empty
 *     array when no rows match.
 *   - End-to-end: wrap the callback with Drizzle and run a `runMigrations`
 *     pass — every migration from the bundle applies and is idempotent
 *     when called a second time.
 */

import Sqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { describe, expect, it } from 'vitest';
import { buildTauriCallback } from '../../src/database/database-provider.web';
import { runMigrations } from '../../src/database/run-migrations';
import * as schema from '@cachink/data/schema';
import type { CachinkDatabase } from '@cachink/data';

type TauriLikeDatabase = Parameters<typeof buildTauriCallback>[0];

/**
 * Thin Tauri-shaped wrapper over a better-sqlite3 connection. Matches the
 * subset of `@tauri-apps/plugin-sql`'s `Database` API that
 * `buildTauriCallback` actually touches (`execute` + `select`). Enough to
 * drive Drizzle's sqlite-proxy driver through the adapter.
 */
function makeTauriShim(sqlite: Sqlite.Database): TauriLikeDatabase {
  const shim = {
    path: ':memory:',
    async execute(sqlText: string, params?: unknown[]): Promise<{ rowsAffected: number }> {
      const stmt = sqlite.prepare(sqlText);
      const info = stmt.run(...(params ?? []));
      return { rowsAffected: info.changes };
    },
    async select<T>(sqlText: string, params?: unknown[]): Promise<T> {
      const stmt = sqlite.prepare(sqlText);
      const rows = stmt.all(...(params ?? []));
      return rows as unknown as T;
    },
    async close(): Promise<boolean> {
      sqlite.close();
      return true;
    },
  };
  return shim as unknown as TauriLikeDatabase;
}

describe('buildTauriCallback', () => {
  it('executes DDL via the `run` method and returns an empty row set', async () => {
    const sqlite = new Sqlite(':memory:');
    const callback = buildTauriCallback(makeTauriShim(sqlite));
    const result = await callback('CREATE TABLE demo (id INTEGER, name TEXT)', [], 'run');
    expect(result.rows).toEqual([]);
    expect(sqlite.prepare('SELECT name FROM sqlite_master WHERE type = ?').all('table')).toEqual(
      expect.arrayContaining([{ name: 'demo' }]),
    );
  });

  it('returns ordered column-value arrays for the `all` method', async () => {
    const sqlite = new Sqlite(':memory:');
    sqlite.exec(`
      CREATE TABLE demo (id INTEGER, name TEXT);
      INSERT INTO demo VALUES (1, 'alpha');
      INSERT INTO demo VALUES (2, 'beta');
    `);
    const callback = buildTauriCallback(makeTauriShim(sqlite));
    const result = await callback('SELECT id, name FROM demo ORDER BY id', [], 'all');
    expect(result.rows).toEqual([
      [1, 'alpha'],
      [2, 'beta'],
    ]);
  });

  it('returns the same shape for `values` as `all`', async () => {
    const sqlite = new Sqlite(':memory:');
    sqlite.exec(`CREATE TABLE demo (id INTEGER); INSERT INTO demo VALUES (42);`);
    const callback = buildTauriCallback(makeTauriShim(sqlite));
    const result = await callback('SELECT id FROM demo', [], 'values');
    expect(result.rows).toEqual([[42]]);
  });

  it('returns a single row as column values for the `get` method', async () => {
    const sqlite = new Sqlite(':memory:');
    sqlite.exec(`
      CREATE TABLE demo (id INTEGER, name TEXT);
      INSERT INTO demo VALUES (1, 'alpha');
      INSERT INTO demo VALUES (2, 'beta');
    `);
    const callback = buildTauriCallback(makeTauriShim(sqlite));
    const result = await callback('SELECT id, name FROM demo WHERE id = ?', [1], 'get');
    expect(result.rows).toEqual([1, 'alpha']);
  });

  it('returns an empty array for a `get` that matches zero rows', async () => {
    const sqlite = new Sqlite(':memory:');
    sqlite.exec(`CREATE TABLE demo (id INTEGER);`);
    const callback = buildTauriCallback(makeTauriShim(sqlite));
    const result = await callback('SELECT id FROM demo WHERE id = ?', [999], 'get');
    expect(result.rows).toEqual([]);
  });
});

describe('runMigrations via the desktop sqlite-proxy adapter', () => {
  it('applies every migration in the bundle on a fresh database', async () => {
    const sqlite = new Sqlite(':memory:');
    const db = drizzle(buildTauriCallback(makeTauriShim(sqlite)), {
      schema,
    }) as unknown as CachinkDatabase;

    await runMigrations(db);

    const tables = sqlite
      .prepare('SELECT name FROM sqlite_master WHERE type = ?')
      .all('table') as Array<{ name: string }>;
    const names = new Set(tables.map((t) => t.name));

    // Every Phase 1B table the 0000 migration creates must exist,
    // plus the sync infrastructure tables added in the 0001 migration
    // (ADR-030).
    for (const expected of [
      'businesses',
      'app_config',
      'sales',
      'expenses',
      'products',
      'inventory_movements',
      'employees',
      'clients',
      'client_payments',
      'day_closes',
      'recurring_expenses',
      '__cachink_migrations',
      '__cachink_change_log',
      '__cachink_sync_state',
      '__cachink_conflicts',
    ]) {
      expect(names, `expected ${expected} to exist`).toContain(expected);
    }
  });

  it('is idempotent — a second run applies nothing', async () => {
    const sqlite = new Sqlite(':memory:');
    const db = drizzle(buildTauriCallback(makeTauriShim(sqlite)), {
      schema,
    }) as unknown as CachinkDatabase;

    await runMigrations(db);
    // Second call must not throw (tables already exist) nor re-insert.
    await runMigrations(db);

    const rows = sqlite.prepare('SELECT tag FROM __cachink_migrations').all() as Array<{
      tag: string;
    }>;
    expect(rows).toEqual([
      { tag: '0000_lying_johnny_blaze' },
      { tag: '0001_change_log_and_sync_state' },
    ]);
  });
});
