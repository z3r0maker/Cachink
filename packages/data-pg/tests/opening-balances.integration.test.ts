import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  lockOpeningBalance,
  openingBalanceClientsOf,
  openingBalanceOf,
  saveOpeningBalance,
} from '../src/queries/opening-balances';
import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';

/**
 * 0025: opening balances are tenant-isolated DOWN rows; the replace-style
 * save round-trips (including line removal), and `lockOpeningBalance` is a
 * one-way gate (N-17's explicit owner lock).
 */
const { url, describe } = integrationSuite();

const C1 = '01HZ8XQN9GZJXV8AKQ5XC1001';
const C2 = '01HZ8XQN9GZJXV8AKQ5XC2002';

describe('0025 opening balances', () => {
  let app: Db;
  let owner: postgres.Sql;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    await seedTwoTenants(owner);
    // A previous run may have left BIZ_A's rows locked; the save path never
    // resets a lock (the use case forbids it), so the test resets its own.
    await owner`DELETE FROM opening_balances WHERE business_id IN (${BIZ_A}, ${BIZ_B})`;
    await owner`DELETE FROM opening_balance_clients WHERE business_id IN (${BIZ_A}, ${BIZ_B})`;
  });

  afterAll(async () => {
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('no opening balance reads as null; a save round-trips header and lines', async () => {
    assert.equal(await openingBalanceOf(app, BIZ_A), null);

    await withBusiness(app, BIZ_A, (tx) =>
      saveOpeningBalance(tx, {
        id: '01HZ8XQN9GZJXV8AKQ5XOB001',
        businessId: BIZ_A,
        fechaApertura: '2026-09-01',
        cajaCentavos: 150_000n,
        bancosCentavos: 2_000_000n,
        lines: [
          { clienteId: C1, saldoCentavos: 40_000n },
          { clienteId: C2, saldoCentavos: 15_000n },
        ],
      }),
    );

    const ob = await withBusiness(app, BIZ_A, (tx) => openingBalanceOf(tx, BIZ_A));
    assert.equal(ob?.fechaApertura, '2026-09-01');
    assert.equal(ob?.cajaCentavos + ob?.bancosCentavos, 2_150_000n);
    assert.equal(ob?.lockedAt ?? null, null);

    const lines = await withBusiness(app, BIZ_A, (tx) => openingBalanceClientsOf(tx, BIZ_A));
    assert.deepEqual(
      lines.map((l) => [l.clienteId, l.saldoCentavos]),
      [
        [C1, 40_000n],
        [C2, 15_000n],
      ],
    );
  });

  it('re-saving replaces: a line that left is gone, an update lands', async () => {
    await withBusiness(app, BIZ_A, (tx) =>
      saveOpeningBalance(tx, {
        id: '01HZ8XQN9GZJXV8AKQ5XOB001',
        businessId: BIZ_A,
        fechaApertura: '2026-09-01',
        cajaCentavos: 100_000n,
        bancosCentavos: 0n,
        lines: [{ clienteId: C1, saldoCentavos: 25_000n }],
      }),
    );
    const lines = await withBusiness(app, BIZ_A, (tx) => openingBalanceClientsOf(tx, BIZ_A));
    assert.deepEqual(
      lines.map((l) => [l.clienteId, l.saldoCentavos]),
      [[C1, 25_000n]],
      'C2 left the import; it must not survive the replace',
    );
    const ob = await withBusiness(app, BIZ_A, (tx) => openingBalanceOf(tx, BIZ_A));
    assert.equal(ob?.cajaCentavos, 100_000n);
  });

  it('another business never sees the rows', async () => {
    const ob = await withBusiness(app, BIZ_B, (tx) => openingBalanceOf(tx, BIZ_A));
    assert.equal(ob, null);
    const lines = await withBusiness(app, BIZ_B, (tx) => openingBalanceClientsOf(tx, BIZ_A));
    assert.equal(lines.length, 0);
  });

  it('the lock is one-way: true once, false after, and the rows read locked', async () => {
    assert.equal(await withBusiness(app, BIZ_A, (tx) => lockOpeningBalance(tx, BIZ_A)), true);
    assert.equal(await withBusiness(app, BIZ_A, (tx) => lockOpeningBalance(tx, BIZ_A)), false);
    const ob = await withBusiness(app, BIZ_A, (tx) => openingBalanceOf(tx, BIZ_A));
    assert.notEqual(ob?.lockedAt ?? null, null);
  });
});
