/**
 * Migration 0012 (C-15 branding) — old → new data (CLAUDE.md §2.9).
 *
 * Builds a database at the schema the phone shipped with, puts a business in
 * it, applies every migration up to 0012, and checks that the row survives,
 * that the seven new columns default exactly as the wire does, and that a
 * pull can write branding the portal set.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrationsBundle } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C15AA';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C15DD';
const NOW = '2026-09-22T12:00:00.000Z';

type Row = Record<string, unknown>;

function apply(db: Database.Database, sql: string): void {
  for (const stmt of splitStatements(sql)) db.exec(stmt);
}

/** Every migration before 0012 — the schema a phone in the field is on. */
function dbBefore0012(): Database.Database {
  const db = new Database(':memory:');
  const m = migrationsBundle.migrations;
  for (const sql of [
    m.m0000,
    m.m0001,
    m.m0002,
    m.m0003,
    m.m0004,
    m.m0005,
    m.m0006,
    m.m0007,
    m.m0008,
    m.m0009,
    m.m0010,
    m.m0011,
  ]) {
    apply(db, sql);
  }
  db.exec(
    `INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, logo_url, business_id, device_id, created_at, updated_at)
     VALUES ('${BIZ}', 'Taquería Don Pedro', 'RESICO', 100, 'https://cdn/logo.png', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
  );
  return db;
}

const business = (db: Database.Database): Row =>
  db.prepare('SELECT * FROM businesses WHERE id = ?').get(BIZ) as Row;

describe('migration 0012_business_branding', () => {
  it('keeps the existing business and its fiscal data', () => {
    const db = dbBefore0012();
    apply(db, migrationsBundle.migrations.m0012);
    const row = business(db);
    expect(row.nombre).toBe('Taquería Don Pedro');
    expect(row.regimen_fiscal).toBe('RESICO');
    expect(row.isr_tasa).toBe(100);
    expect(row.logo_url).toBe('https://cdn/logo.png');
  });

  it('defaults the seven columns exactly as the wire does', () => {
    const db = dbBefore0012();
    apply(db, migrationsBundle.migrations.m0012);
    const row = business(db);
    expect(row.brand_color).toBeNull();
    expect(row.receipt_template).toBe('clasico');
    expect(row.receipt_leyenda).toBeNull();
    expect(row.address_print).toBe(0);
    expect(row.whatsapp).toBeNull();
    expect(row.direccion).toBeNull();
    expect(row.social_links).toBe('{}');
  });

  it('accepts branding a pull brings down from the portal', () => {
    const db = dbBefore0012();
    apply(db, migrationsBundle.migrations.m0012);
    db.prepare(
      `UPDATE businesses
          SET brand_color = ?, receipt_template = ?, receipt_leyenda = ?, address_print = ?,
              whatsapp = ?, direccion = ?, social_links = ?
        WHERE id = ?`,
    ).run(
      '#FFD60A',
      'ticket',
      '¡Gracias por su compra!',
      1,
      '55 1234 5678',
      'Av. Insurgentes 123, CDMX',
      '{"instagram":"@donpedro"}',
      BIZ,
    );
    const row = business(db);
    expect(row.brand_color).toBe('#FFD60A');
    expect(row.receipt_template).toBe('ticket');
    expect(row.address_print).toBe(1);
    expect(row.direccion).toBe('Av. Insurgentes 123, CDMX');
    expect(row.social_links).toBe('{"instagram":"@donpedro"}');
  });

  it('leaves a business created after the migration on the same defaults', () => {
    const db = dbBefore0012();
    apply(db, migrationsBundle.migrations.m0012);
    const other = '01HZ8XQN9GZJXV8AKQ5X0C15BB';
    db.exec(
      `INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
       VALUES ('${other}', 'Nueva', 'RIF', 200, '${other}', '${DEV}', '${NOW}', '${NOW}')`,
    );
    const row = db.prepare('SELECT * FROM businesses WHERE id = ?').get(other) as Row;
    expect(row.receipt_template).toBe('clasico');
    expect(row.address_print).toBe(0);
    expect(row.social_links).toBe('{}');
  });
});
