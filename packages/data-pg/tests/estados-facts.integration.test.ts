import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';

import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { valuacionApertura } from '../src/queries/estados-facts';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * Money leaves this package as `bigint` centavos or it does not leave at all.
 *
 * `valuacionApertura` typed a Postgres `sum()` as `bigint` when the driver
 * actually hands back the numeric as **text**. TypeScript believed the
 * annotation, and `bigint + string` is legal JavaScript — so the Balance's
 * `capitalInicial` concatenated instead of adding and «Total capital» read
 * -$640,885,164,500.00 on a real tenant. Nothing threw; the statement was
 * simply wrong.
 *
 * `typeof` is the whole point of this test: asserting the value alone would
 * have passed against the string too (`'0' == 0n` is not how assert works, but
 * a seeded 0 would have compared fine either way).
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const { url, describe } = integrationSuite();

describe('estados facts come back as bigint centavos', () => {
  let db: Db;
  beforeAll(() => {
    db = createDb(url as string);
  });
  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('valuacionApertura returns a bigint, not the driver text', async () => {
    const v = await withBusiness(db, BIZ, (tx) => valuacionApertura(tx, BIZ));
    assert.equal(typeof v, 'bigint', `sum() came back as ${typeof v}`);
  });

  it('a tenant with no apertura movements answers 0n, still a bigint', async () => {
    // `coalesce(..., 0)` is the empty case, and it is also text.
    const vacio = '01HZ8XQN9GZJXV8AKQ5XNADA0';
    const v = await withBusiness(db, vacio, (tx) => valuacionApertura(tx, vacio));
    assert.equal(typeof v, 'bigint');
    assert.equal(v, 0n);
  });

  it('a real apertura sums to its own centavos, not to a joined-up string', async () => {
    // The two cases above both land on 0 — where `0n` and `'0'` are hard to
    // tell apart by value, which is why they assert `typeof`. This is the
    // other half: a non-zero sum, in its own tenant, where concatenation and
    // addition give visibly different answers. 7 × 1500 adds to 10_500;
    // glued together it would read 71500 (ADR-095 needed this for the stock
    // query's twin, and it belongs here too).
    const biz = testId('J');
    await withBusiness(db, biz, (tx) =>
      tx.execute(sql`
        INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos,
                                         motivo, business_id, device_id, created_at, updated_at)
        VALUES (${testId('K')}, ${testId('P')}, '2026-01-02', 'entrada', 7, 1500,
                'Apertura de inventario', ${biz}, ${biz}, now(), now())`),
    );
    const v = await withBusiness(db, biz, (tx) => valuacionApertura(tx, biz));
    assert.equal(typeof v, 'bigint');
    assert.equal(v, 10_500n, '7 × 1500 centavos, added — not concatenated');
  });

  it('the value survives arithmetic with other centavos', async () => {
    // The failure mode was addition turning into concatenation, so add.
    const v = await withBusiness(db, BIZ, (tx) => valuacionApertura(tx, BIZ));
    const sumado = v + 100n;
    assert.equal(typeof sumado, 'bigint');
    assert.equal(sumado - v, 100n);
  });
});
