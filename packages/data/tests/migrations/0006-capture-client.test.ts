/**
 * Migration 0001 (capture client) — old → new data (CLAUDE.md §2.9).
 *
 * Builds a database at schema 0000 holding a pre-pivot Director user and a
 * caja turno, applies 0001, and checks that nothing was lost, the new
 * column defaults correctly, and the new change-log triggers capture the
 * UP tables LAN sync never covered.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migration0000Sql } from '../../drizzle/migrations/0000_initial.js';
import { migration0006Sql } from '../../drizzle/migrations/0006_capture_client.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const USR = '01HZ8XQN9GZJXV8AKQ5X0C7USR';
const NOW = '2026-09-16T12:00:00.000Z';

function apply(db: Database.Database, sql: string): void {
  for (const stmt of splitStatements(sql)) db.exec(stmt);
}

function dbAt0000WithData(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  apply(db, migration0000Sql);
  db.exec(`INSERT INTO users (id, nombre, pin_hash, recovery_password_hash, role, business_id, device_id, created_at, updated_at)
           VALUES ('${USR}', 'Director Test', 'h', 'r', 'director', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`);
  return db;
}

function insertTurno(db: Database.Database, id: string): void {
  db.exec(`INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, monto_apertura_centavos, efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
           VALUES ('${id}', '${USR}', '2026-09-16', '${NOW}', 50000, 0, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`);
}

describe('migration 0001_capture_client', () => {
  it('keeps existing users and marks them active', () => {
    const db = dbAt0000WithData();
    apply(db, migration0006Sql);
    const row = db
      .prepare('SELECT nombre, role, active FROM users WHERE id = ?')
      .get(USR) as Record<string, unknown>;
    expect(row).toEqual({ nombre: 'Director Test', role: 'director', active: 1 });
  });

  it('captures caja_turnos writes in the change log (no trigger existed before)', () => {
    const before = dbAt0000WithData();
    insertTurno(before, 'T-BEFORE');
    expect(
      before
        .prepare("SELECT COUNT(*) AS n FROM __cachink_change_log WHERE table_name = 'caja_turnos'")
        .get(),
    ).toEqual({ n: 0 });

    const db = dbAt0000WithData();
    apply(db, migration0006Sql);
    insertTurno(db, 'T-AFTER');
    db.exec(`UPDATE caja_turnos SET explicacion = 'x', updated_at = '${NOW}' WHERE id = 'T-AFTER'`);
    const ops = db
      .prepare("SELECT op FROM __cachink_change_log WHERE table_name = 'caja_turnos' ORDER BY id")
      .all();
    expect(ops).toEqual([{ op: 'insert' }, { op: 'update' }]);
  });

  it('adds triggers for every UP table LAN sync missed', () => {
    const db = dbAt0000WithData();
    apply(db, migration0006Sql);
    const names = (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all() as {
        name: string;
      }[]
    ).map((r) => r.name);
    for (const t of [
      'caja_turnos',
      'caja_movimientos',
      'cancelacion_logs',
      'entregas_credito',
      'conversions',
      'auditorias_inventario',
    ]) {
      expect(names).toContain(`trg_${t}_ai`);
      expect(names).toContain(`trg_${t}_au`);
    }
  });

  it('creates __sync_row_status with a status CHECK and a composite key', () => {
    const db = dbAt0000WithData();
    apply(db, migration0006Sql);
    db.exec(
      "INSERT INTO __sync_row_status (table_name, row_id, status) VALUES ('sales', 'S1', 'pending')",
    );
    expect(() =>
      db.exec(
        "INSERT INTO __sync_row_status (table_name, row_id, status) VALUES ('sales', 'S2', 'lost')",
      ),
    ).toThrow();
    expect(() =>
      db.exec(
        "INSERT INTO __sync_row_status (table_name, row_id, status) VALUES ('sales', 'S1', 'accepted')",
      ),
    ).toThrow();
  });
});
