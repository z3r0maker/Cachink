/**
 * Migration 0004 (Cachink → Xangarro sync tables) — old → new data
 * (CLAUDE.md §2.9).
 *
 * Builds a database at schema 0003 with pending change-log rows, a push
 * high-water mark and a recorded conflict, applies 0004, and checks that
 * nothing is lost, the change-log triggers write to the renamed table, and
 * the AUTOINCREMENT sequence survives (a reset would reuse ids at or below
 * the HWM and silently skip those rows on the next push).
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const NOW = '2026-09-16T12:00:00.000Z';
const PRE_RENAME = [
  '0000_initial',
  '0001_capture_client',
  '0002_operator_only',
  '0003_stock_baseline',
];

function apply(db: Database.Database, tag: string): void {
  for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) db.exec(stmt);
}

function insertBusiness(db: Database.Database, id: string): void {
  db.exec(`INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
           VALUES ('${id}', 'Negocio ${id}', 'RIF', 30, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`);
}

function dbAt0003WithSyncData(): Database.Database {
  const db = new Database(':memory:');
  for (const tag of PRE_RENAME) apply(db, tag);
  insertBusiness(db, 'B1');
  insertBusiness(db, 'B2');
  insertBusiness(db, 'B3');
  // Rows 1–2 were pushed and purged; row 3 is still pending.
  db.exec(`DELETE FROM __cachink_change_log WHERE id <= 2`);
  db.exec(`INSERT INTO __cachink_sync_state (scope, value) VALUES ('localPushHwm', '2')`);
  db.exec(`INSERT INTO __cachink_conflicts (direction, table_name, row_id, loser_updated_at, loser_device_id, winner_updated_at, winner_device_id, reason)
           VALUES ('inbound', 'businesses', 'B1', '${NOW}', 'A', '${NOW}', 'B', 'stale')`);
  return db;
}

function tableNames(db: Database.Database): string[] {
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]
  ).map((r) => r.name);
}

describe('migration 0009_xangarro_sync_tables', () => {
  it('keeps pending change-log rows, the push HWM and recorded conflicts', () => {
    const db = dbAt0003WithSyncData();
    apply(db, '0009_xangarro_sync_tables');

    expect(db.prepare('SELECT id, row_id FROM __xangarro_change_log ORDER BY id').all()).toEqual([
      { id: 3, row_id: 'B3' },
    ]);
    expect(
      db.prepare('SELECT value FROM __xangarro_sync_state WHERE scope = ?').get('localPushHwm'),
    ).toEqual({
      value: '2',
    });
    expect(db.prepare('SELECT row_id, reason FROM __xangarro_conflicts').all()).toEqual([
      { row_id: 'B1', reason: 'stale' },
    ]);
  });

  it('removes every legacy table, index and trigger reference', () => {
    const db = dbAt0003WithSyncData();
    apply(db, '0009_xangarro_sync_tables');

    const names = tableNames(db);
    expect(names.filter((n) => n.startsWith('__cachink_'))).toEqual([]);
    const legacySql = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE sql LIKE '%__cachink_%' OR name LIKE '%cachink%'",
      )
      .all();
    expect(legacySql).toEqual([]);
    const idx = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?");
    expect(idx.get('idx_xangarro_conflicts_detected_at')).toEqual({
      name: 'idx_xangarro_conflicts_detected_at',
    });
  });

  it('keeps capturing writes into the renamed change log after the rename', () => {
    const db = dbAt0003WithSyncData();
    apply(db, '0009_xangarro_sync_tables');
    insertBusiness(db, 'B4');
    db.exec(`UPDATE businesses SET nombre = 'x', updated_at = '${NOW}' WHERE id = 'B4'`);

    const rows = db
      .prepare("SELECT row_id, op FROM __xangarro_change_log WHERE row_id = 'B4' ORDER BY id")
      .all();
    expect(rows).toEqual([
      { row_id: 'B4', op: 'insert' },
      { row_id: 'B4', op: 'update' },
    ]);
  });

  it('continues the id sequence instead of reusing ids at or below the HWM', () => {
    const db = dbAt0003WithSyncData();
    db.exec('DELETE FROM __cachink_change_log');
    apply(db, '0009_xangarro_sync_tables');
    insertBusiness(db, 'B5');

    const row = db.prepare("SELECT id FROM __xangarro_change_log WHERE row_id = 'B5'").get() as {
      id: number;
    };
    expect(row.id).toBe(4);
  });

  it('fails loudly on a database that never ran 0000 (no silent partial rename)', () => {
    const db = new Database(':memory:');
    expect(() => apply(db, '0009_xangarro_sync_tables')).toThrow(/no such table/);
  });
});
