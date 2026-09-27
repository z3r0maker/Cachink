import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';
import { products } from '@xangarro/data';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { MAX_VARIABLES, upsertBatches, upsertRows } from '../src/upsert-batch.js';

/**
 * A pulled page is written a batch of rows per statement, not a statement per
 * row: a snapshot page of thousands of movements was thousands of awaited
 * round trips to the phone's SQLite.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BIZ01';
const producto = (id: string, nombre: string) => ({
  id,
  nombre,
  categoria: 'Producto Terminado',
  costoUnitCentavos: 1000n,
  precioVentaCentavos: 2500n,
  unidad: 'pza',
  seguirStock: true,
  businessId: BIZ,
  deviceId: 'srv',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  deletedAt: null,
});

describe('upsert in batches', () => {
  it('groups rows by the columns they carry, in first-seen order', () => {
    const batches = upsertBatches([{ id: 'a', x: 1 }, { id: 'b' }, { id: 'c', x: 2 }]);
    assert.deepEqual(
      batches.map((b) => b.map((r) => r['id'])),
      [['a', 'c'], ['b']],
    );
  });

  it('never binds more than 999 variables in one statement (SQLite before 3.32)', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: `r${i}`, a: 1, b: 2, c: 3 }));
    const batches = upsertBatches(rows);
    assert.ok(batches.every((b) => b.length * 4 <= MAX_VARIABLES));
    assert.equal(batches.flat().length, 1000, 'no row lost');
  });

  it('inserts, then updates in place, and leaves alone a column a row does not carry', async () => {
    const db = makeFreshDb();
    await upsertRows(db, products, [
      { ...producto('P1', 'Pastor'), sku: 'S-1' },
      { ...producto('P2', 'Suadero'), sku: 'S-2' },
    ]);
    await upsertRows(db, products, [producto('P1', 'Pastor grande')]);
    const rows = (await db.all(sql`SELECT id, nombre, sku FROM products ORDER BY id`)) as {
      id: string;
      nombre: string;
      sku: string;
    }[];
    assert.deepEqual(rows, [
      { id: 'P1', nombre: 'Pastor grande', sku: 'S-1' },
      { id: 'P2', nombre: 'Suadero', sku: 'S-2' },
    ]);
  });

  it('keeps the last copy of a row sent twice in one page', async () => {
    const db = makeFreshDb();
    await upsertRows(db, products, [producto('P1', 'Viejo'), producto('P1', 'Nuevo')]);
    const rows = (await db.all(sql`SELECT nombre FROM products`)) as { nombre: string }[];
    assert.deepEqual(rows, [{ nombre: 'Nuevo' }]);
  });

  it('refuses a table without an id column', async () => {
    const db = makeFreshDb();
    await assert.rejects(
      upsertRows(db, {} as typeof products, [{ id: 'x' }]),
      /no id column|Cannot/,
    );
  });
});
