import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

/**
 * Old → new for 0001_add_business_fiscal (CLAUDE.md §2.9): a phone that
 * already has its business keeps it intact, gains four NULL fiscal columns,
 * and can store what the portal later sends down.
 */
const apply = (db: Database.Database, tag: string) => {
  for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) db.exec(stmt);
};

describe('migration 0001 — business fiscal columns', () => {
  it('keeps an existing business, adds the columns as NULL, and they take values', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    apply(db, '0000_initial');
    db.prepare(
      `INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
       VALUES ('B1', 'Taquería Don Pedro', 'RESICO', 125, 'B1', 'D1', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
    ).run();

    apply(db, '0001_add_business_fiscal');

    const row = db.prepare('SELECT * FROM businesses WHERE id = ?').get('B1') as Record<
      string,
      unknown
    >;
    assert.equal(row['nombre'], 'Taquería Don Pedro');
    assert.equal(row['regimen_fiscal'], 'RESICO');
    for (const c of ['rfc', 'razon_social', 'codigo_postal', 'uso_cfdi']) {
      assert.ok(c in row, `${c} exists`);
      assert.equal(row[c], null, `${c} starts NULL`);
    }

    db.prepare(
      `UPDATE businesses SET rfc = 'XOJI740919U48', uso_cfdi = 'G03' WHERE id = 'B1'`,
    ).run();
    const after = db.prepare('SELECT rfc, uso_cfdi FROM businesses').get() as Record<
      string,
      unknown
    >;
    assert.deepEqual(after, { rfc: 'XOJI740919U48', uso_cfdi: 'G03' });
  });
});
