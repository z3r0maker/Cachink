import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { periodBalanceInputs } from '../src/queries';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * F-1's inputs: the cortes, client payments, stock-at-cost snapshot and merma
 * rows a period's Balance, Flujo and Indicadores are computed from. Each part
 * is filtered by day (timestamps on the last day count), skips deleted rows,
 * and — for stock — nets entradas against salidas including mermas, because a
 * merma leaves the inventory exactly like a sale does.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('Q');

describe('periodBalanceInputs', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      const pan = testId('A');
      const queso = testId('B');
      const muerto = testId('C');
      const product = (id: string, costo: number, deleted = false) =>
        tx.execute(sql`
          INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                                seguir_stock, precio_venta_centavos, business_id, device_id,
                                created_at, updated_at, deleted_at)
          VALUES (${id}, ${id}, 'Producto Terminado', ${costo}, 'pza', 3, 'producto', true, ${costo * 2},
                  ${BIZ}, ${BIZ}, now(), now(), ${deleted ? sql`now()` : null})`);
      await product(pan, 500);
      await product(queso, 700);
      await product(muerto, 900, true);

      const movement = (
        id: string,
        productoId: string,
        fecha: string,
        tipo: 'entrada' | 'salida',
        cantidad: number,
        motivo: string,
        deleted = false,
      ) =>
        tx.execute(sql`
          INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos,
                                           motivo, business_id, device_id, created_at, updated_at, deleted_at)
          VALUES (${id}, ${productoId}, ${fecha}, ${tipo}, ${cantidad}, 500, ${motivo},
                  ${BIZ}, ${BIZ}, now(), now(), ${deleted ? sql`now()` : null})`);
      await movement(testId('M'), pan, '2026-05-01', 'entrada', 10, 'Compra a proveedor');
      await movement(testId('M'), pan, '2026-05-05', 'salida', 3, 'Venta');
      await movement(testId('M'), pan, '2026-05-10', 'salida', 2, 'Merma / daño');
      // Out of range and deleted mermas must not reach the statements.
      await movement(testId('M'), pan, '2026-06-05', 'salida', 1, 'Merma / daño');
      await movement(testId('M'), pan, '2026-05-06', 'salida', 4, 'Merma / daño', true);

      const corte = (id: string, fecha: string, device: string, contado: number) =>
        tx.execute(sql`
          INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                                  diferencia_centavos, cerrado_por, business_id, device_id,
                                  created_at, updated_at)
          VALUES (${id}, ${fecha}, ${contado}, ${contado}, 0, 'Director', ${BIZ}, ${device}, now(), now())`);
      await corte(testId('D'), '2026-05-10', 'dev-1', 100_000);
      await corte(testId('D'), '2026-05-11', 'dev-1', 110_000);
      await corte(testId('D'), '2026-05-11', 'dev-2', 50_000);
      await corte(testId('D'), '2026-06-01', 'dev-1', 999_999);

      // ADR-074: abonos belong to the client; the credit sale names them.
      const cliente = testId('L');
      await tx.execute(sql`
        INSERT INTO clients (id, nombre, business_id, device_id, created_at, updated_at)
        VALUES (${cliente}, 'Doña Mary', ${BIZ}, ${BIZ}, now(), now())`);
      // C-17: the header (metodo, cliente, estado) lives in tickets.
      await tx.execute(sql`
        INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, cliente_id,
                             business_id, device_id, created_at, updated_at)
        VALUES (${testId('V')}, 1, '2026-05-02', 'Fiesta', 'Crédito', 'parcial',
                ${cliente}, ${BIZ}, ${BIZ}, now(), now())`);
      await tx.execute(sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${testId('V')}, ${testId('V')}, '2026-05-02', 'Fiesta', 'Producto', 80_000,
                ${pan}, 1, ${BIZ}, ${BIZ}, now(), now())`);
      const pago = (id: string, fecha: string, monto: number, deleted = false) =>
        tx.execute(sql`
          INSERT INTO client_payments (id, cliente_id, fecha, monto_centavos, metodo, business_id,
                                       device_id, created_at, updated_at, deleted_at)
          VALUES (${id}, ${cliente}, ${fecha}, ${monto}, 'Efectivo', ${BIZ}, ${BIZ},
                  now(), now(), ${deleted ? sql`now()` : null})`);
      await pago(testId('P'), '2026-05-12', 40_000);
      await pago(testId('P'), '2026-04-30', 10_000);
      await pago(testId('P'), '2026-05-13', 20_000, true);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('returns the period cortes per device, latest-day rows included, others excluded', async () => {
    const { cortes } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    assert.deepEqual(
      cortes.map((c) => `${c.fecha}|${c.deviceId}|${c.efectivoContadoCentavos}`).sort(),
      ['2026-05-10|dev-1|100000', '2026-05-11|dev-1|110000', '2026-05-11|dev-2|50000'],
    );
  });

  it('returns only the period live client payments, with their client', async () => {
    const { pagos } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    assert.equal(pagos.length, 1);
    assert.equal(pagos[0]?.montoCentavos, 40_000n);
    assert.ok(pagos[0]?.clienteId !== undefined, 'the balance nets abonos per client (ADR-074)');
  });

  it('nets stock per product at cost — entradas minus every salida, merma included', async () => {
    const { stock } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    const byCost = new Map(stock.map((s) => [s.costoUnitCentavos, s.cantidad]));
    // The snapshot is current, not period-scoped (the phone's risk #3), so
    // June's merma has also left the inventory by "today".
    assert.equal(byCost.get(500n), 4, '10 entradas − 3 venta − 2 merma − 1 merma de junio');
    assert.equal(byCost.get(700n), 0, 'a product with no movements nets zero');
    assert.ok(!byCost.has(900n), 'a deleted product is not valued');
  });

  it('hands the domain real numbers and real bigints, not driver text', async () => {
    // ADR-094's rule, applied to the one money query that already satisfied
    // it by accident: a Postgres `sum()` comes back from the driver as *text*
    // (sum over int4 or int8 is numeric either way), and `bigint + string` is
    // legal JavaScript — it concatenates. `valuacionApertura` shipped that way
    // into capitalInicial and took the whole Posición tab down.
    //
    // The stock query survives it for two reasons that are easy to delete by
    // accident: the `::int` cast on the sum, and Drizzle's own bigint mapper
    // on `products.costo_unit_centavos`. Without the cast, `BigInt(cantidad)`
    // still parses "4" — and then a fractional or malformed value throws at
    // the calculator instead of at the boundary. So assert the types here.
    const { stock } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    assert.ok(stock.length > 0, 'the fixture products must come back');
    for (const s of stock) {
      assert.equal(typeof s.cantidad, 'number', 'cantidad must be a number, not "4"');
      assert.ok(Number.isInteger(s.cantidad), 'cantidad must be a whole unit count');
      assert.equal(typeof s.costoUnitCentavos, 'bigint', 'centavos must be a bigint');
    }
    // And the valuation the domain computes from them is a bigint too — the
    // concatenation bug shows up here as a string, not as a wrong number.
    const inventarios = stock.reduce((t, s) => t + s.costoUnitCentavos * BigInt(s.cantidad), 0n);
    assert.equal(typeof inventarios, 'bigint');
  });

  it('reports a product whose salidas exceed its entradas as negative, unclamped', async () => {
    // The data layer states the fact; flooring it at zero is the domain's
    // rule (ADR-095), asserted in `domain/tests/financials/balance-general`.
    // If this ever starts returning 0, the clamp moved and the two layers are
    // now clamping the same thing twice.
    const vacio = testId('N');
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                              seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${vacio}, ${vacio}, 'Producto Terminado', 1100, 'pza', 3, 'producto', true, 2200,
                ${BIZ}, ${BIZ}, now(), now())`);
      await tx.execute(sql`
        INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos,
                                         motivo, business_id, device_id, created_at, updated_at)
        VALUES (${testId('M')}, ${vacio}, '2026-05-04', 'salida', 7, 1100, 'Venta',
                ${BIZ}, ${BIZ}, now(), now())`);
    });

    const { stock } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    assert.equal(stock.find((s) => s.costoUnitCentavos === 1_100n)?.cantidad, -7);
  });

  it('returns only in-range merma salidas — not Ventas, not deleted, not out of range', async () => {
    const { merma } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    assert.deepEqual(merma, [{ cantidad: 2, costoUnitCentavos: 500n }]);
  });
});
