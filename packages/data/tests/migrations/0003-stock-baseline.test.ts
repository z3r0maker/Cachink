/**
 * Migration 0003 (stock baseline) — old → new data (CLAUDE.md §2.9): existing
 * movements are untouched and the new baseline table starts empty, so every
 * product's stock is the same before and after.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { journal, migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const NOW = '2026-09-16T12:00:00.000Z';
const STOCK_SQL = `SELECT SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END) AS stock
  FROM inventory_movements WHERE producto_id = 'P1'`;

function dbThrough(lastTag: string): Database.Database {
  const db = new Database(':memory:');
  for (const entry of journal.entries) {
    for (const stmt of splitStatements(migrationSqlByTag[entry.tag] ?? '')) db.exec(stmt);
    if (entry.tag === lastTag) break;
  }
  return db;
}

describe('migration 0003_stock_baseline', () => {
  it('keeps every movement and starts with an empty baseline', () => {
    const db = dbThrough('0002_operator_only');
    db.exec(`INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id, created_at, updated_at)
             VALUES ('P1', 'Taco', 'Producto Terminado', 0, 'pza', 'B', 'D', '${NOW}', '${NOW}')`);
    for (const [id, tipo, n] of [
      ['M1', 'entrada', 10],
      ['M2', 'salida', 3],
    ] as const) {
      db.exec(`INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
               VALUES ('${id}', 'P1', '2026-09-16', '${tipo}', ${n}, 0, 'x', 'B', 'D', '${NOW}', '${NOW}')`);
    }
    const before = db.prepare(STOCK_SQL).get();
    for (const stmt of splitStatements(migrationSqlByTag['0003_stock_baseline'] ?? ''))
      db.exec(stmt);
    expect(db.prepare(STOCK_SQL).get()).toEqual(before);
    expect(db.prepare('SELECT COUNT(*) AS n FROM __stock_baseline').get()).toEqual({ n: 0 });
  });
});
