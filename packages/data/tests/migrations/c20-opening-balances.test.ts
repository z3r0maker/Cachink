/**
 * Migration 0013 (C-20 saldos iniciales) — old → new data (CLAUDE.md §2.9).
 *
 * Builds a database at the schema the phone shipped with, puts a business and
 * a cliente in it, applies 0013, and checks that nothing was lost, that both
 * tables exist with the audit shape every synced table carries, and that a
 * pull can write a header and a per-cliente saldo.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrationsBundle } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C20AA';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C20DD';
const CLI = '01HZ8XQN9GZJXV8AKQ5X0C20CL';
const NOW = '2026-09-22T12:00:00.000Z';

type Row = Record<string, unknown>;

function apply(db: Database.Database, sql: string): void {
  for (const stmt of splitStatements(sql)) db.exec(stmt);
}

/** Every migration before 0013 — the schema a phone in the field is on. */
function dbBefore0013(): Database.Database {
  const db = new Database(':memory:');
  const m = migrationsBundle.migrations as Record<string, string>;
  for (let i = 0; i <= 12; i++) {
    const sql = m[`m${String(i).padStart(4, '0')}`];
    if (!sql) throw new Error(`migration m${i} missing`);
    apply(db, sql);
  }
  db.exec(
    `INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
     VALUES ('${BIZ}', 'Taquería Don Pedro', 'RESICO', 100, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
  );
  db.exec(
    `INSERT INTO clients (id, nombre, business_id, device_id, created_at, updated_at)
     VALUES ('${CLI}', 'Doña Mari', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
  );
  return db;
}

const tableNames = (db: Database.Database): string[] =>
  (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as Row[]).map(
    (r) => r.name as string,
  );

describe('migration 0013_opening_balances', () => {
  it('leaves the existing rows untouched', () => {
    const db = dbBefore0013();
    expect(tableNames(db)).not.toContain('opening_balances');
    apply(db, migrationsBundle.migrations.m0013);
    const biz = db.prepare('SELECT nombre FROM businesses WHERE id = ?').get(BIZ) as Row;
    const cli = db.prepare('SELECT nombre FROM clients WHERE id = ?').get(CLI) as Row;
    expect(biz.nombre).toBe('Taquería Don Pedro');
    expect(cli.nombre).toBe('Doña Mari');
  });

  it('creates both tables with the audit shape', () => {
    const db = dbBefore0013();
    apply(db, migrationsBundle.migrations.m0013);
    const names = tableNames(db);
    expect(names).toContain('opening_balances');
    expect(names).toContain('opening_balance_clients');
    for (const table of ['opening_balances', 'opening_balance_clients']) {
      const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as Row[]).map(
        (c) => c.name as string,
      );
      expect(cols).toEqual(
        expect.arrayContaining([
          'id',
          'business_id',
          'device_id',
          'created_by_user_id',
          'created_at',
          'updated_at',
          'deleted_at',
        ]),
      );
    }
  });

  it('stores a header and a per-cliente saldo, money as integer centavos', () => {
    const db = dbBefore0013();
    apply(db, migrationsBundle.migrations.m0013);
    db.exec(
      `INSERT INTO opening_balances (id, fecha_apertura, caja_centavos, bancos_centavos, locked_at, business_id, device_id, created_at, updated_at)
       VALUES ('ob1', '2026-01-01', 150000, 4200000, NULL, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
    );
    db.exec(
      `INSERT INTO opening_balance_clients (id, cliente_id, saldo_centavos, business_id, device_id, created_at, updated_at)
       VALUES ('obc1', '${CLI}', 86000, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
    );
    const header = db.prepare('SELECT * FROM opening_balances WHERE id = ?').get('ob1') as Row;
    const line = db
      .prepare('SELECT * FROM opening_balance_clients WHERE id = ?')
      .get('obc1') as Row;
    expect(header.caja_centavos).toBe(150000);
    expect(header.bancos_centavos).toBe(4200000);
    expect(header.locked_at).toBeNull();
    expect(line.cliente_id).toBe(CLI);
    expect(line.saldo_centavos).toBe(86000);
  });

  it('carries the lock the portal sets', () => {
    const db = dbBefore0013();
    apply(db, migrationsBundle.migrations.m0013);
    db.exec(
      `INSERT INTO opening_balances (id, fecha_apertura, caja_centavos, bancos_centavos, locked_at, business_id, device_id, created_at, updated_at)
       VALUES ('ob2', '2026-01-01', 0, 0, '${NOW}', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
    );
    const row = db.prepare('SELECT locked_at FROM opening_balances WHERE id = ?').get('ob2') as Row;
    expect(row.locked_at).toBe(NOW);
  });
});
