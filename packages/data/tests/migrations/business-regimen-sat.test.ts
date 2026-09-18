import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { REGIMEN_FISCAL, regimenFromLegacy } from '@xangarro/domain';

import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

/**
 * Old → new for 0002 (CLAUDE.md §2.9), and the guard that the migration's SQL
 * backfill says exactly what the domain's `regimenFromLegacy` says — for every
 * legacy name and every SAT code.
 */
const apply = (db: Database.Database, tag: string) => {
  for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) db.exec(stmt);
};

describe('migration 0002 — regimen_sat', () => {
  it('backfills every stored régimen the way the domain maps it, and keeps the name', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    apply(db, '0000_initial');
    apply(db, '0001_add_business_fiscal');
    const values = [
      'RESICO',
      'RIF',
      'Asalariados',
      'Otro',
      'algo raro',
      ...Object.keys(REGIMEN_FISCAL),
    ];
    const insert = db.prepare(
      `INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
       VALUES (?, 'Negocio', ?, 125, ?, 'D1', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
    );
    values.forEach((v, i) => insert.run(`B${i}`, v, `B${i}`));

    apply(db, '0002_add_business_regimen_sat');

    const rows = db
      .prepare('SELECT regimen_fiscal AS r, regimen_sat AS s FROM businesses')
      .all() as {
      r: string;
      s: string | null;
    }[];
    assert.equal(rows.length, values.length);
    for (const row of rows) {
      assert.equal(row.s, regimenFromLegacy(row.r), `«${row.r}»`);
    }
    assert.ok(
      rows.some((r) => r.r === 'Otro' && r.s === null),
      '«Otro» is not guessed',
    );
  });
});
