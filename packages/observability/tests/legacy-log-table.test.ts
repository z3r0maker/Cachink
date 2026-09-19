/**
 * Observability log survives the Cachink → Xangarro table rename (ADR-056).
 *
 * The log table is created by this package, not by a data migration, so it
 * may or may not exist when the app boots. The audit hash chain must keep
 * every row.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { adoptLegacyLogTable, LEGACY_TABLE } from '../src/legacy-log-table.js';
import { SqliteLogStore } from '../src/sqlite-log-store.js';
import { CREATE_TABLE_SQL, TABLE, type SqliteDatabase } from '../src/sqlite-log-store-sql.js';

function adapter(sqlite: Database.Database): SqliteDatabase {
  return {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    runAsync: async (sql, params) => {
      sqlite.prepare(sql).run(...params);
    },
    getAllAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    getFirstAsync: async <T>(sql: string, params: unknown[] = []) =>
      (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
  };
}

function hasTable(sqlite: Database.Database, name: string): boolean {
  return (
    sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !==
    undefined
  );
}

function legacyInstall(): Database.Database {
  const sqlite = new Database(':memory:');
  sqlite.exec(CREATE_TABLE_SQL.replace(TABLE, LEGACY_TABLE));
  sqlite.exec(
    `INSERT INTO ${LEGACY_TABLE} (id, type, timestamp, device_id) VALUES ('L1', 'audit', '2026-09-01T00:00:00.000Z', 'dev')`,
  );
  return sqlite;
}

describe('adoptLegacyLogTable', () => {
  it('renames the legacy log and keeps its rows before the store initializes', async () => {
    const sqlite = legacyInstall();
    await new SqliteLogStore(adapter(sqlite), { deviceId: 'dev' }).initialize();

    expect(hasTable(sqlite, LEGACY_TABLE)).toBe(false);
    expect(sqlite.prepare(`SELECT id FROM ${TABLE}`).all()).toEqual([{ id: 'L1' }]);
  });

  it('does nothing on a fresh install', async () => {
    const sqlite = new Database(':memory:');
    await adoptLegacyLogTable(adapter(sqlite));
    expect(hasTable(sqlite, LEGACY_TABLE)).toBe(false);
    expect(hasTable(sqlite, TABLE)).toBe(false);
  });

  it('keeps the current table when both exist', async () => {
    const sqlite = legacyInstall();
    sqlite.exec(`CREATE TABLE ${TABLE} (id TEXT PRIMARY KEY)`);
    await adoptLegacyLogTable(adapter(sqlite));
    expect(hasTable(sqlite, LEGACY_TABLE)).toBe(true);
    expect(sqlite.prepare(`SELECT COUNT(*) AS n FROM ${TABLE}`).get()).toEqual({ n: 0 });
  });

  it('treats a driver that returns no row as "no legacy table"', async () => {
    const db: SqliteDatabase = {
      execAsync: async () => {
        throw new Error('must not rename');
      },
      runAsync: async () => undefined,
      getAllAsync: async <T>() => [] as T[],
      getFirstAsync: async () => null,
    };
    await expect(adoptLegacyLogTable(db)).resolves.toBeUndefined();
  });
});
