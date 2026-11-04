/**
 * Migration 0014 (ADR-134 product photos) — old → new data (CLAUDE.md §2.9).
 *
 * Builds a database at the schema the phone shipped with, puts a business and
 * a product in it, applies 0014, and checks that nothing was lost, that the
 * table carries the audit shape every synced table has, and that an insert
 * reaches the change log as an `insert` so the outbox pushes it.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrationsBundle } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C24BZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C24DV';
const PRD = '01HZ8XQN9GZJXV8AKQ5X0C24PR';
const IMG = '01HZ8XQN9GZJXV8AKQ5X0C24MG';
const NOW = '2026-11-03T12:00:00.000Z';

type Row = Record<string, unknown>;

function apply(db: Database.Database, sql: string): void {
  for (const stmt of splitStatements(sql)) db.exec(stmt);
}

/** Every migration before 0014 — the schema a phone in the field is on. */
function dbBefore0014(): Database.Database {
  const db = new Database(':memory:');
  const m = migrationsBundle.migrations as Record<string, string>;
  for (let i = 0; i <= 13; i++) {
    const sql = m[`m${String(i).padStart(4, '0')}`];
    if (!sql) throw new Error(`migration m${i} missing`);
    apply(db, sql);
  }
  db.exec(
    `INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
     VALUES ('${BIZ}', 'Taquería Don Pedro', 'RESICO', 100, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
  );
  db.exec(
    `INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id, created_at, updated_at)
     VALUES ('${PRD}', 'Refresco 600 ml', 'Producto Terminado', 1500, 'pza', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
  );
  return db;
}

const tableNames = (db: Database.Database): string[] =>
  (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as Row[]).map(
    (r) => r.name as string,
  );

describe('migration 0014_product_images', () => {
  it('leaves the existing rows untouched', () => {
    const db = dbBefore0014();
    expect(tableNames(db)).not.toContain('product_images');
    apply(db, migrationsBundle.migrations.m0014);
    const prd = db.prepare('SELECT nombre FROM products WHERE id = ?').get(PRD) as Row;
    expect(prd.nombre).toBe('Refresco 600 ml');
  });

  it('creates the table with the audit shape and the photo columns', () => {
    const db = dbBefore0014();
    apply(db, migrationsBundle.migrations.m0014);
    const cols = (db.prepare('PRAGMA table_info(product_images)').all() as Row[]).map(
      (c) => c.name as string,
    );
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'producto_id',
        'mime',
        'bytes',
        'width',
        'height',
        'business_id',
        'device_id',
        'created_by_user_id',
        'created_at',
        'updated_at',
        'deleted_at',
      ]),
    );
  });

  it('a photo and a tombstone insert, and each reaches the change log as an insert', () => {
    const db = dbBefore0014();
    apply(db, migrationsBundle.migrations.m0014);
    const insert = db.prepare(
      `INSERT INTO product_images (id, producto_id, mime, bytes, width, height, business_id, device_id, created_at, updated_at)
       VALUES (?, ?, 'image/webp', ?, ?, ?, ?, ?, ?, ?)`,
    );
    insert.run(IMG, PRD, 'UklGRg==', 512, 512, BIZ, DEV, NOW, NOW);
    insert.run(`${IMG.slice(0, 25)}2`, PRD, null, null, null, BIZ, DEV, NOW, NOW);
    const log = db
      .prepare(
        `SELECT row_id, op FROM __xangarro_change_log WHERE table_name = 'product_images' ORDER BY id`,
      )
      .all() as Row[];
    expect(log.map((l) => l.op)).toEqual(['insert', 'insert']);
    expect(log[0]?.row_id).toBe(IMG);
    const stored = db
      .prepare('SELECT mime, bytes FROM product_images WHERE id = ?')
      .get(IMG) as Row;
    expect(stored).toEqual({ mime: 'image/webp', bytes: 'UklGRg==' });
  });
});
