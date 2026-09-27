import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { asesorInputs } from '../src/queries';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * The capacidades' counts (ADR-115), against the row shapes the seed does not
 * have — which is the only shape that tells the old counts from the new ones.
 *
 * `compras` and `mesesConGasto` are **maxima over a group**, because the
 * insights they promise are per-product and per-category. Counted estate-wide
 * they unlock a capacidad whose insight still computes nothing, and after
 * ADR-113 an unlocked capacidad is what lets a Diagnóstico section assert a
 * finding. Each test below is built so the estate-wide count and the group
 * maximum disagree.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('1');
const HOY = '2026-05-12';

async function producto(tx: Parameters<Parameters<Db['transaction']>[0]>[0], id: string) {
  await tx.execute(sql`
    INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                          seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
    VALUES (${id}, ${`P-${id.slice(-4)}`}, 'Producto Terminado', 500, 'pza', 3, 'producto', true, 900,
            ${BIZ}, ${BIZ}, now(), now())`);
}

describe('asesor capacidad counts', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      // Two products, ONE entrada each. Estate-wide that is 2 compras — enough
      // to unlock «2 compras del producto» — but no product has a previous
      // entrada to compare against, so `costosQueSubieron` finds nothing.
      for (const dia of ['2026-03-01', '2026-03-02']) {
        const p = testId('2');
        await producto(tx, p);
        await tx.execute(sql`
          INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos,
                                           motivo, business_id, device_id, created_at, updated_at)
          VALUES (${testId('3')}, ${p}, ${dia}, 'entrada', 10, 500, 'Compra a proveedor',
                  ${BIZ}, ${BIZ}, now(), now())`);
      }
      // Two categories, two prior months each. Estate-wide that is four
      // distinct months — enough to unlock «3 meses por categoría» — but
      // neither category has the three months the baseline averages. The May
      // rows are the current month and must not count toward the baseline.
      const egresos: readonly [string, string][] = [
        ['Renta', '2026-02-01'],
        ['Renta', '2026-03-01'],
        ['Luz', '2026-04-01'],
        ['Luz', '2026-01-01'],
        ['Renta', '2026-05-03'],
        ['Luz', '2026-05-04'],
      ];
      for (const [categoria, fecha] of egresos) {
        await tx.execute(sql`
          INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos,
                                business_id, device_id, created_at, updated_at)
          VALUES (${testId('4')}, ${fecha}, 'x', ${categoria}, 10000, ${BIZ}, ${BIZ}, now(), now())`);
      }
    });
  });

  afterAll(async () => {
    // This tenant's rows are its own; take them with it. Runs on failure too.
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`DELETE FROM expenses WHERE business_id = ${BIZ}`);
      await tx.execute(sql`DELETE FROM inventory_movements WHERE business_id = ${BIZ}`);
      await tx.execute(sql`DELETE FROM products WHERE business_id = ${BIZ}`);
    }).catch(() => undefined);
    await db?.$client.end({ timeout: 5 });
  });

  it('counts compras of the best single product, not every entrada in the tenant', async () => {
    const { cuenta } = await withBusiness(db, BIZ, (tx) => asesorInputs(tx, HOY));

    assert.equal(cuenta.compras, 1, 'two products with one entrada each is 1, not 2');
  });

  it('counts prior months of the best single category, and never the current month', async () => {
    const { cuenta } = await withBusiness(db, BIZ, (tx) => asesorInputs(tx, HOY));

    // Renta: Feb, Mar. Luz: Jan, Apr. Four distinct months across the tenant,
    // two per category — and the May rows are excluded as the current month.
    assert.equal(cuenta.mesesConGasto, 2, 'the best category has two prior months, not four');
  });

  it('counts days with an inventory movement, which is not days with a venta', async () => {
    const { cuenta } = await withBusiness(db, BIZ, (tx) => asesorInputs(tx, HOY));

    // Two entradas on two different days; this tenant has no ventas at all.
    assert.equal(cuenta.diasConMovimiento, 2);
    assert.equal(
      cuenta.diasConVenta,
      0,
      'Inventario must not be gated on a count that is zero here',
    );
  });
});
