import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { periodLedger } from '../src/queries';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * P-14's period ledger: filtered in SQL by day, inclusive at both ends — a
 * `fecha` stored as a full timestamp on the last day still counts — and
 * cancelled or deleted sales never do.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('L');

describe('periodLedger', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      const prod = testId('P');
      await tx.execute(sql`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                              seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${prod}, 'Pan', 'Producto Terminado', 500, 'pza', 3, 'producto', false, 1000, ${BIZ}, ${BIZ}, now(), now())`);
      const venta = (fecha: string, cancelada = false) =>
        tx.execute(sql`
          INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago,
                             producto_id, cantidad, business_id, device_id, created_at, updated_at,
                             cancelled_at)
          VALUES (${testId('S')}, ${fecha}, 'Pan', 'Producto', 1000, 'Efectivo', 'pagado', ${prod}, 1,
                  ${BIZ}, ${BIZ}, now(), now(), ${cancelada ? sql`now()` : null})`);
      await venta('2026-04-30');
      await venta('2026-05-01');
      await venta('2026-05-31T23:40:00-06:00');
      await venta('2026-05-15', true);
      await tx.execute(sql`
        INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${testId('E')}, '2026-05-20', 'Gas', 'Servicios', 30000, ${BIZ}, ${BIZ}, now(), now())`);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('takes both ends of the range, timestamps included, and no cancelled sale', async () => {
    const l = await withBusiness(db, BIZ, (tx) => periodLedger(tx, '2026-05-01', '2026-05-31'));
    assert.deepEqual(l.ventas.map((v) => v.fecha.slice(0, 10)).sort(), [
      '2026-05-01',
      '2026-05-31',
    ]);
    assert.equal(l.egresos.length, 1);
  });

  it('a one-day range is just that day', async () => {
    const l = await withBusiness(db, BIZ, (tx) => periodLedger(tx, '2026-04-30', '2026-04-30'));
    assert.equal(l.ventas.length, 1);
    assert.equal(l.egresos.length, 0);
  });
});
