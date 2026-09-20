/**
 * Migration 0002 (operator-only users) — old → new data (CLAUDE.md §2.9).
 *
 * A database at 0001 holding a pre-pivot Director with a turno applies 0002:
 * the row, its PIN, permissions and references survive; the four retired
 * columns are gone; new operators insert without them.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migration0000Sql } from '../../drizzle/migrations/0000_initial.js';
import { migration0006Sql } from '../../drizzle/migrations/0006_capture_client.js';
import { migration0007Sql } from '../../drizzle/migrations/0007_operator_only.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const USR = '01HZ8XQN9GZJXV8AKQ5X0C7USR';
const NOW = '2026-09-16T12:00:00.000Z';

function apply(db: Database.Database, sql: string): void {
  for (const stmt of splitStatements(sql)) db.exec(stmt);
}

function dbAt0001WithData(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  apply(db, migration0000Sql);
  apply(db, migration0006Sql);
  db.exec(`INSERT INTO users (id, nombre, email, pin_hash, recovery_password_hash, role, must_change_pin, permissions, business_id, device_id, created_at, updated_at)
           VALUES ('${USR}', 'Director Test', 'd@x.mx', 'pin-hash', 'r', 'director', 1, '{"canCancelSales":true}', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`);
  db.exec(`INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, monto_apertura_centavos, efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
           VALUES ('T1', '${USR}', '2026-09-16', '${NOW}', 50000, 0, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`);
  return db;
}

function userColumns(db: Database.Database): string[] {
  return (db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>).map(
    (c) => c.name,
  );
}

describe('migration 0002_operator_only', () => {
  it('drops role, must_change_pin, recovery_password_hash and email', () => {
    const db = dbAt0001WithData();
    apply(db, migration0007Sql);
    const cols = userColumns(db);
    for (const gone of ['role', 'must_change_pin', 'recovery_password_hash', 'email']) {
      expect(cols).not.toContain(gone);
    }
    expect(cols).toEqual(expect.arrayContaining(['pin_hash', 'active', 'permissions']));
  });

  it('keeps existing operators, their PIN, permissions and turnos', () => {
    const db = dbAt0001WithData();
    apply(db, migration0007Sql);
    expect(
      db.prepare('SELECT nombre, pin_hash, active, permissions FROM users WHERE id = ?').get(USR),
    ).toEqual({
      nombre: 'Director Test',
      pin_hash: 'pin-hash',
      active: 1,
      permissions: '{"canCancelSales":true}',
    });
    expect(db.prepare('SELECT user_id FROM caja_turnos WHERE id = ?').get('T1')).toEqual({
      user_id: USR,
    });
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });

  it('accepts a synced operator without the retired columns', () => {
    const db = dbAt0001WithData();
    apply(db, migration0007Sql);
    db.exec(`INSERT INTO users (id, nombre, pin_hash, business_id, device_id, created_at, updated_at)
             VALUES ('U2', 'Toni', 'h', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`);
    expect(db.prepare('SELECT active, permissions FROM users WHERE id = ?').get('U2')).toEqual({
      active: 1,
      permissions: '{}',
    });
  });
});
