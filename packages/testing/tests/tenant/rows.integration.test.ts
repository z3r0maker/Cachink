// @vitest-environment node
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, it } from 'vitest';

import { integrationSuite } from '../../src/integration.js';
import {
  addDevice,
  addExpense,
  addExpenseReceipt,
  addLogo,
  addOperator,
  addProduct,
  addProductPhoto,
  addSale,
  asOwner,
  asTenant,
  BIZ,
  FixtureDatabaseError,
  freeSlots,
  mintCodeFor,
  mintTenant,
  resetThrottle,
  seedDoorProducts,
  type Tenant,
} from '../../src/tenant/index.js';
import { UNREACHABLE, withEnv } from './env.js';

/**
 * The rows composed onto a minted tenant, its activation codes and the
 * operator door's database half, through the app role.
 */
const suite = integrationSuite();
const FECHA = '2026-09-17';

suite.describe('@xangarro/testing/tenant: rows, codes and the door', () => {
  let a: Tenant;
  let b: Tenant;
  const doorSku = `S02-${randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    [a, b] = await Promise.all([mintTenant({ label: 'Filas' }), mintTenant({ label: 'Otra' })]);
  });

  // The door writes onto the seeded tenant: take the test's product back out.
  afterAll(async () => {
    await asOwner(
      (sql) => sql`DELETE FROM products WHERE business_id = ${BIZ} AND sku = ${doorSku}`,
    );
  });

  /** Every row builder, called the simplest way, for the checks that apply to all. */
  const builders: readonly (readonly [string, (t: Tenant) => Promise<unknown>])[] = [
    ['addProduct', (t) => addProduct(t)],
    ['addSale', (t) => addSale(t, { fecha: FECHA, monto: 4500 })],
    ['addOperator', (t) => addOperator(t)],
    ['addExpense', (t) => addExpense(t, { fecha: FECHA, concepto: 'Gas' })],
    ['addDevice', (t) => addDevice(t)],
    ['mintCodeFor', (t) => mintCodeFor(t)],
    ['freeSlots', (t) => freeSlots(t)],
  ];

  it('each row lands on its own tenant and is invisible to another', async () => {
    const product = await addProduct(a, { nombre: 'Agua', precio: 1500, seguirStock: true });
    const sale = await addSale(a, { fecha: FECHA, monto: 3000, productoId: product, cantidad: 2 });
    const operator = await addOperator(a, { nombre: 'Ana', permissions: { cobrar: true } });
    const gasto = await addExpense(a, { fecha: FECHA, concepto: 'Luz', operador: 'Beto' });
    const photo = await addProductPhoto(a, product);
    const receipt = await addExpenseReceipt(a, gasto);
    const device = await addDevice(a, 'Caja sur');
    const ids = { product, sale, operator, gasto, photo, receipt, device };

    const q = (biz: string) =>
      asTenant(biz, async (sql) => ({
        product: (await sql`SELECT id FROM products WHERE id = ${product}`).length,
        sale: (await sql`SELECT id FROM sales WHERE id = ${sale} AND ticket_id = ${sale}`).length,
        operator: (await sql`SELECT id FROM users WHERE id = ${operator}`).length,
        gasto: (
          await sql`SELECT id FROM expenses WHERE id = ${gasto} AND caja_turno_id IS NOT NULL`
        ).length,
        photo: (await sql`SELECT id FROM product_images WHERE id = ${photo}`).length,
        receipt: (await sql`SELECT id FROM expense_receipts WHERE id = ${receipt}`).length,
        device: (await sql`SELECT id FROM devices WHERE id = ${device}`).length,
      }));
    const ones = Object.fromEntries(Object.keys(ids).map((k) => [k, 1]));
    const zeros = Object.fromEntries(Object.keys(ids).map((k) => [k, 0]));
    assert.deepEqual(await q(a.biz), ones);
    assert.deepEqual(await q(b.biz), zeros);
  });

  it('a gasto without an operador is a portal gasto: no user and no turno', async () => {
    const id = await addExpense(a, { fecha: FECHA, concepto: 'Renta', monto: 500_000 });
    const [row] = await asTenant(
      a.biz,
      (sql) => sql`SELECT caja_turno_id, monto_centavos FROM expenses WHERE id = ${id}`,
    );
    assert.equal(row?.caja_turno_id, null);
    assert.equal(BigInt(row?.monto_centavos), 500_000n);
  });

  it('money is centavos: a fractional amount is refused, not rounded', async () => {
    await assert.rejects(addProduct(a, { precio: 15.5 }), /bigint/);
    const productoId = await addProduct(a);
    await assert.rejects(
      addSale(a, { fecha: FECHA, monto: 0.5, folio: 900, productoId }),
      /bigint/,
    );
    await assert.rejects(addExpense(a, { fecha: FECHA, concepto: 'x', monto: 1.25 }), /bigint/);
  });

  it('folios are unique per device (ADR-073): a second sale needs its own', async () => {
    const t = await mintTenant();
    const productoId = await addProduct(t);
    await addSale(t, { fecha: FECHA, monto: 100, productoId });
    await assert.rejects(
      addSale(t, { fecha: FECHA, monto: 100, productoId }),
      /idx_tickets_device_folio/,
    );
    await addSale(t, { fecha: FECHA, monto: 100, productoId, folio: 2 });
  });

  it('a sale without a product is refused, and leaves no orphan ticket', async () => {
    const t = await mintTenant();
    await assert.rejects(addSale(t, { fecha: FECHA, monto: 100 }), /producto_id/);
    const tickets = await asTenant(t.biz, (sql) => sql`SELECT 1 FROM tickets`);
    assert.equal(tickets.length, 0);
  });

  it('a tenant has one logo: a second refuses rather than replacing it', async () => {
    await addLogo(b, '<svg xmlns="http://www.w3.org/2000/svg"/>');
    await assert.rejects(addLogo(b, '<svg xmlns="http://www.w3.org/2000/svg"/>'), /duplicate key/);
  });

  it('every builder fails with a typed error when no database is configured', async () => {
    await withEnv({ DATABASE_URL: undefined }, async () => {
      for (const [name, build] of builders) {
        await assert.rejects(build(a), FixtureDatabaseError, `${name} did not fail typed`);
      }
    });
  });

  it('every builder rejects when the database is unreachable', async () => {
    await withEnv({ DATABASE_URL: UNREACHABLE }, async () => {
      for (const [name, build] of builders) {
        await assert.rejects(build(a), /ECONNREFUSED/, `${name} did not reject`);
      }
    });
  });

  it('mintCodeFor writes a live code for the tenant, and an expired one when asked', async () => {
    const live = await mintCodeFor(a);
    const dead = await mintCodeFor(a, '-1 hour');
    const rows = await asTenant(
      a.biz,
      (sql) => sql`SELECT code, email, expires_at > now() AS vivo FROM activation_codes
                   WHERE code IN (${live}, ${dead}) ORDER BY vivo DESC`,
    );
    assert.deepEqual(
      rows.map((r) => [r.code, r.email, r.vivo]),
      [
        [live, a.email, true],
        [dead, a.email, false],
      ],
    );
  });

  it('mintCodeFor refuses an expiry Postgres cannot read as an interval', async () => {
    await assert.rejects(mintCodeFor(a, 'pronto'), /interval/);
  });

  it('freeSlots revokes every live device of its tenant only, and is safe to repeat', async () => {
    const [x, y] = await Promise.all([mintTenant(), mintTenant()]);
    await freeSlots(x);
    await freeSlots(x);
    const live = (t: Tenant) =>
      asTenant(t.biz, (sql) => sql`SELECT id FROM devices WHERE revoked_at IS NULL`);
    assert.equal((await live(x)).length, 0);
    assert.equal((await live(y)).length, 1);
  });

  it('seedDoorProducts puts a product on the seeded tenant once per sku', async () => {
    const p = { nombre: 'Refresco S02', precioCentavos: 2500, sku: doorSku };
    await seedDoorProducts([p]);
    await seedDoorProducts([p, p]);
    const rows = await asTenant(
      BIZ,
      (sql) => sql`SELECT precio_venta_centavos FROM products WHERE sku = ${doorSku}`,
    );
    assert.equal(rows.length, 1);
    assert.equal(BigInt(rows[0]?.precio_venta_centavos), 2500n);
  });

  it('seedDoorProducts with nothing to seed does not even connect', async () => {
    await withEnv({ DATABASE_URL: undefined }, () => seedDoorProducts([]));
    await withEnv({ DATABASE_URL: undefined }, () =>
      assert.rejects(
        seedDoorProducts([{ nombre: 'x', precioCentavos: 1, sku: doorSku }]),
        FixtureDatabaseError,
      ),
    );
  });

  it('resetThrottle empties the throttle table, through the owner connection only', async () => {
    await asOwner(
      (sql) => sql`INSERT INTO xangarro.throttle (key, hits, window_start)
                   VALUES (${`s02-${randomUUID()}`}, 1, now())`,
    );
    await resetThrottle();
    const left = await asOwner((sql) => sql`SELECT count(*) AS n FROM xangarro.throttle`);
    assert.equal(Number(left[0]?.n), 0);
    await withEnv({ DATABASE_SUPER_URL: UNREACHABLE }, () =>
      assert.rejects(resetThrottle(), /ECONNREFUSED/),
    );
  });
});
