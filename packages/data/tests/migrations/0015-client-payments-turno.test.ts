/**
 * Migration 0015 (ADR-146) — old → new data (CLAUDE.md §2.9).
 *
 * Builds a database at the schema the phone shipped with, records an abono
 * there, applies 0015, and checks that the abono survived with no turno, that
 * a new abono keeps its turno, and that the insert still reaches the change
 * log so the outbox pushes it.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrationsBundle } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C15BZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C15DV';
const CLI = '01HZ8XQN9GZJXV8AKQ5X0C15CL';
const VIEJO = '01HZ8XQN9GZJXV8AKQ5X0C15A1';
const NUEVO = '01HZ8XQN9GZJXV8AKQ5X0C15A2';
const TURNO = '01HZ8XQN9GZJXV8AKQ5X0C15TR';
const NOW = '2026-11-18T12:00:00.000Z';

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

const abono = (id: string, turno: string | null): string =>
  `INSERT INTO client_payments (id, cliente_id, fecha, monto_centavos, metodo, ${turno === null ? '' : 'caja_turno_id, '}business_id, device_id, created_at, updated_at)
   VALUES ('${id}', '${CLI}', '2026-11-18', 50000, 'Efectivo', ${turno === null ? '' : `'${turno}', `}'${BIZ}', '${DEV}', '${NOW}', '${NOW}')`;

/** Every migration before 0015, with one abono recorded on it. */
function dbBefore0015(): Database.Database {
  const db = new Database(':memory:');
  for (let i = 0; i <= 14; i++) apply(db, migration(i));
  db.exec(abono(VIEJO, null));
  return db;
}

const columnas = (db: Database.Database): string[] =>
  (db.prepare(`PRAGMA table_info(client_payments)`).all() as Row[]).map((r) => r.name as string);

describe('migration 0015 · client_payments.caja_turno_id', () => {
  it('adds the nullable column', () => {
    const db = dbBefore0015();
    expect(columnas(db)).not.toContain('caja_turno_id');
    apply(db, migration(15));
    const col = (db.prepare(`PRAGMA table_info(client_payments)`).all() as Row[]).find(
      (r) => r.name === 'caja_turno_id',
    );
    expect(col?.notnull).toBe(0);
  });

  it('keeps an abono recorded before it, with no turno', () => {
    const db = dbBefore0015();
    apply(db, migration(15));
    const row = db.prepare(`SELECT * FROM client_payments WHERE id = ?`).get(VIEJO) as Row;
    expect(row.monto_centavos).toBe(50000);
    expect(row.caja_turno_id).toBeNull();
  });

  it('stores the turno of a new abono', () => {
    const db = dbBefore0015();
    apply(db, migration(15));
    db.exec(abono(NUEVO, TURNO));
    const row = db.prepare(`SELECT caja_turno_id FROM client_payments WHERE id = ?`).get(NUEVO);
    expect(row).toEqual({ caja_turno_id: TURNO });
  });

  it('still logs a new abono for the outbox', () => {
    const db = dbBefore0015();
    apply(db, migration(15));
    db.exec(abono(NUEVO, TURNO));
    const log = (
      db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%change_log'`)
        .all() as Row[]
    ).map((r) => r.name as string);
    expect(log).toHaveLength(1);
    const ops = db
      .prepare(`SELECT op FROM ${log[0] ?? ''} WHERE table_name = 'client_payments' AND row_id = ?`)
      .all(NUEVO);
    expect(ops).toEqual([{ op: 'insert' }]);
  });
});
