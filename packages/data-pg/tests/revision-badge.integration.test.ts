import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { shellCounts } from '../src/queries';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * The sidebar's Revisión de caja badge counts the rows the screen lists.
 *
 * Until 2026-09-25 it did not: the badge was `REVISION_FIXTURE.productos.length
 * + REVISION_FIXTURE.clientes.length`, a constant 6, while the page read
 * Postgres. Production showed a 6 over «Nada por revisar en productos», and
 * nothing was wrong — the two numbers had never come from the same place.
 *
 * So what is proved here is the agreement, against real rows: the count moves
 * with the data, and it excludes exactly what the screen's own predicate
 * excludes. A count that is merely non-zero would have passed on the fixture.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('R');
const OTRO = testId('S');

describe('shellCounts: the Revisión badge', () => {
  let db: Db;

  const producto = (id: string, estado: string, borrado = false, biz = BIZ) => sql`
    INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                          tipo, seguir_stock, precio_venta_centavos, estado_revision,
                          business_id, device_id, created_at, updated_at, deleted_at)
    VALUES (${id}, ${`Producto ${id}`}, 'Producto Terminado', 100, 'pza', 3, 'producto', false,
            500, ${estado}, ${biz}, ${biz}, now(), now(), ${borrado ? sql`now()` : null})`;

  const cliente = (id: string, estado: string, borrado = false) => sql`
    INSERT INTO clients (id, nombre, telefono, estado_revision, business_id, device_id,
                         created_at, updated_at, deleted_at)
    VALUES (${id}, ${`Cliente ${id}`}, '5550000000', ${estado}, ${BIZ}, ${BIZ},
            now(), now(), ${borrado ? sql`now()` : null})`;

  beforeAll(async () => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('is zero for a tenant whose operators created nothing', async () => {
    const counts = await withBusiness(db, BIZ, (tx) => shellCounts(tx, BIZ));
    assert.equal(counts.revisionPendiente, 0);
  });

  it('counts pending products and pending clients together', async () => {
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(producto(testId('P'), 'pendiente'));
      await tx.execute(producto(testId('P'), 'pendiente'));
      await tx.execute(cliente(testId('C'), 'pendiente'));
    });
    const counts = await withBusiness(db, BIZ, (tx) => shellCounts(tx, BIZ));
    assert.equal(counts.revisionPendiente, 3);
  });

  it('leaves out reviewed rows, so approving one lowers the badge', async () => {
    const aprobado = testId('P');
    await withBusiness(db, BIZ, (tx) => tx.execute(producto(aprobado, 'aprobado')));
    const counts = await withBusiness(db, BIZ, (tx) => shellCounts(tx, BIZ));
    assert.equal(counts.revisionPendiente, 3, 'an approved row is not pending');
  });

  it('leaves out deleted rows, however they are marked', async () => {
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(producto(testId('P'), 'pendiente', true));
      await tx.execute(cliente(testId('C'), 'pendiente', true));
    });
    const counts = await withBusiness(db, BIZ, (tx) => shellCounts(tx, BIZ));
    assert.equal(counts.revisionPendiente, 3);
  });

  it("never counts another tenant's rows", async () => {
    await withBusiness(db, OTRO, (tx) =>
      tx.execute(producto(testId('P'), 'pendiente', false, OTRO)),
    );
    const mios = await withBusiness(db, BIZ, (tx) => shellCounts(tx, BIZ));
    const suyos = await withBusiness(db, OTRO, (tx) => shellCounts(tx, OTRO));
    assert.equal(mios.revisionPendiente, 3);
    assert.equal(suyos.revisionPendiente, 1);
  });
});
