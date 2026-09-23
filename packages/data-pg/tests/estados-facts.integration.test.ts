import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';

import { createDb, withBusiness, type Db } from '../src/client';
import { valuacionApertura } from '../src/queries/estados-facts';
import { integrationSuite } from './support/db';

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

  it('the value survives arithmetic with other centavos', async () => {
    // The failure mode was addition turning into concatenation, so add.
    const v = await withBusiness(db, BIZ, (tx) => valuacionApertura(tx, BIZ));
    const sumado = v + 100n;
    assert.equal(typeof sumado, 'bigint');
    assert.equal(sumado - v, 100n);
  });
});
