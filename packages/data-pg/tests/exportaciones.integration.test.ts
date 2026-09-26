import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  exportarGastos,
  exportarMovimientosInventario,
  exportarVentas,
  listMovimientosInventario,
  todas,
} from '../src/queries';
import { integrationSuite } from './support/db';
import { seedLedger, type LedgerFixture } from './support/ledger-fixture';
import { testId } from './support/test-ids';

/**
 * «Exportar» is the whole history (DB2-EXP-01). «Exportar movimientos» used
 * the Productos list, which stops at 50, and shipped 50 rows as if they were
 * all. Here a tenant has 63 movements, and the batches are made small so the
 * keyset walk crosses several of them: every row arrives exactly once,
 * newest first, and the count equals the table's.
 */
const { url, describe } = integrationSuite();
const MOVIMIENTOS = 63;

describe('exports read everything, in keyset batches', () => {
  let app: Db;
  let owner: postgres.Sql;
  let fx: LedgerFixture;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    fx = await seedLedger(owner, 'X');
    const prod = testId('P');
    const now = new Date('2026-05-12T14:00:00Z');
    const fila = { business_id: fx.biz, device_id: fx.dev, created_at: now, updated_at: now };
    await owner`INSERT INTO products ${owner({ id: prod, nombre: 'Tortilla', categoria: 'Materia Prima', costo_unit_centavos: 10, unidad: 'kg', ...fila })}`;
    const filas = Array.from({ length: MOVIMIENTOS }, (_, i) => ({
      id: testId('M'),
      producto_id: prod,
      // Several rows share a day, so the cursor has to break ties on id.
      fecha: `2026-05-${String(1 + (i % 9)).padStart(2, '0')}`,
      tipo: i % 3 === 0 ? 'salida' : 'entrada',
      cantidad: 1 + i,
      costo_unit_centavos: 10,
      motivo: i % 3 === 0 ? 'Merma / daño' : 'Compra',
      ...fila,
    }));
    await owner`INSERT INTO inventory_movements ${owner(filas)}`;
    await owner`INSERT INTO inventory_movements ${owner({ ...filas[0], id: testId('M'), deleted_at: now })}`;
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${fx.biz}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('exports every live movement, where the screen list stops at 50', async () => {
    const [todo, pantalla, cuenta] = await withBusiness(
      app,
      fx.biz,
      async (tx) =>
        [
          await todas(exportarMovimientosInventario(tx, 10)),
          await listMovimientosInventario(tx),
          // The count the export has to match, read the plain way.
          await tx.execute<{ n: number }>(
            sql`SELECT count(*)::int AS n FROM inventory_movements WHERE deleted_at IS NULL`,
          ),
        ] as const,
    );
    const n = cuenta[0]?.n;
    assert.equal(pantalla.length, 50);
    assert.equal(todo.length, MOVIMIENTOS);
    assert.equal(todo.length, n);
    assert.equal(new Set(todo.map((r) => r.id)).size, MOVIMIENTOS, 'no row twice');
    const fechas = todo.map((r) => r.fecha);
    assert.deepEqual(fechas, [...fechas].sort().reverse(), 'newest first');
    assert.equal(todo[0]?.producto, 'Tortilla');
    assert.ok(
      todo.every((r) => r.cantidad > 0),
      'cantidad is the positive quantity',
    );
  });

  it('ventas carry method and cancellation; gastos their category', async () => {
    const [ventas, gastos] = await withBusiness(
      app,
      fx.biz,
      async (tx) =>
        [await todas(exportarVentas(tx, 2)), await todas(exportarGastos(tx, 2))] as const,
    );
    // Seven live lines in the fixture (the deleted one is out), cancelled kept.
    assert.equal(ventas.length, 7);
    assert.equal(ventas.find((v) => v.concepto === 'Gringa')?.cancelada, true);
    assert.equal(ventas.find((v) => v.concepto === 'Orden 100% maíz')?.clasificacion, 'Crédito');
    assert.equal(ventas.find((v) => v.concepto === 'Refresco')?.amount, 2_000n);
    assert.equal(gastos.length, 4);
    assert.deepEqual(new Set(gastos.map((g) => g.clasificacion)), new Set(['Nómina', 'Renta']));
  });

  it('another tenant exports nothing', async () => {
    const other = testId('O');
    assert.deepEqual(
      await withBusiness(app, other, (tx) => todas(exportarMovimientosInventario(tx))),
      [],
    );
  });
});
