/**
 * Migration 0016 (ADR-149 gasto receipts) — old → new data (CLAUDE.md §2.9).
 *
 * Builds a database at the schema the phone shipped with, records a gasto
 * there, applies 0016, and checks that the gasto survived, that the table
 * carries the audit shape every synced table has and refuses a receipt with
 * no bytes, and that an insert reaches the change log so the outbox pushes it.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrationsBundle } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C16BZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C16DV';
const GASTO = '01HZ8XQN9GZJXV8AKQ5X0C16GS';
const RCP = '01HZ8XQN9GZJXV8AKQ5X0C16RC';
const NOW = '2026-11-19T12:00:00.000Z';

type Row = Record<string, unknown>;

function apply(db: Database.Database, sql: string): void {
  for (const stmt of splitStatements(sql)) db.exec(stmt);
}

const migration = (i: number): string => {
  const sql = (migrationsBundle.migrations as Record<string, string>)[
    `m${String(i).padStart(4, '0')}`
  ];
  if (!sql) throw new Error(`migration m${i} missing`);
  return sql;
};

/** Every migration before 0016, with one gasto recorded on it. */
function dbBefore0016(): Database.Database {
  const db = new Database(':memory:');
  for (let i = 0; i <= 15; i++) apply(db, migration(i));
  db.exec(
    `INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
     VALUES ('${GASTO}', '2026-11-19', 'Hielo', 'Materia Prima', 4500, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`,
  );
  return db;
}

const receipt = (bytes: string | null): string =>
  `INSERT INTO expense_receipts (id, gasto_id, mime, bytes, width, height, business_id, device_id, created_at, updated_at)
   VALUES ('${RCP}', '${GASTO}', 'image/webp', ${bytes === null ? 'NULL' : `'${bytes}'`}, 768, 1024, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')`;

describe('migration 0016_expense_receipts', () => {
  it('leaves the existing gasto untouched', () => {
    const db = dbBefore0016();
    const tables = (
      db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as Row[]
    ).map((r) => r.name);
    expect(tables).not.toContain('expense_receipts');
    apply(db, migration(16));
    const row = db.prepare('SELECT concepto, monto_centavos FROM expenses WHERE id = ?').get(GASTO);
    expect(row).toEqual({ concepto: 'Hielo', monto_centavos: 4500 });
  });

  it('creates the table with the audit shape and the photo columns', () => {
    const db = dbBefore0016();
    apply(db, migration(16));
    const cols = db.prepare('PRAGMA table_info(expense_receipts)').all() as Row[];
    const notNull = (name: string) => cols.find((c) => c.name === name)?.notnull;
    expect(cols.map((c) => c.name)).toEqual(
      expect.arrayContaining([
        'id',
        'gasto_id',
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
    for (const c of ['gasto_id', 'bytes', 'width', 'height']) expect(notNull(c)).toBe(1);
  });

  it('indexes the receipts by gasto, newest first to read', () => {
    const db = dbBefore0016();
    apply(db, migration(16));
    const cols = (db.prepare(`PRAGMA index_info(idx_expense_receipts_gasto)`).all() as Row[]).map(
      (r) => r.name,
    );
    expect(cols).toEqual(['gasto_id', 'created_at']);
  });

  it('refuses a receipt with no bytes: there is no tombstone', () => {
    const db = dbBefore0016();
    apply(db, migration(16));
    expect(() => db.exec(receipt(null))).toThrow(/NOT NULL/);
  });

  it('logs a new receipt for the outbox as an insert, with its bytes as text', () => {
    const db = dbBefore0016();
    apply(db, migration(16));
    db.exec(receipt('UklGRg=='));
    const ops = db
      .prepare(
        `SELECT op FROM __xangarro_change_log WHERE table_name = 'expense_receipts' AND row_id = ?`,
      )
      .all(RCP);
    expect(ops).toEqual([{ op: 'insert' }]);
    const stored = db.prepare('SELECT bytes FROM expense_receipts WHERE id = ?').get(RCP);
    expect(stored).toEqual({ bytes: 'UklGRg==' });
  });
});
