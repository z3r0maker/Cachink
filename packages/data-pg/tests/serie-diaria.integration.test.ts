import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';

import { createDb, withBusiness, type Db } from '../src/client';
import { serieDiaria, totalsForRange } from '../src/queries';
import { integrationSuite } from './support/db';

/**
 * P-13's 30-day line against the seed (Taquería, May 2026): every day in the
 * range present, zeros included, and the sum of the series equal to
 * `totalsForRange` — the hero and the chart must not disagree.
 */
const { url, describe } = integrationSuite();
/** The seeded Taquería Don Pedro (seed-data.ts). */
const TENANT_A = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

describe('serieDiaria', () => {
  let db: Db;
  beforeAll(() => {
    db = createDb(url as string);
  });
  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('has one point per day, zeros included', async () => {
    const s = await withBusiness(db, TENANT_A, (tx) => serieDiaria(tx, '2026-04-13', '2026-05-12'));
    assert.equal(s.length, 30);
    assert.equal(s[0]?.fecha, '2026-04-13');
    assert.equal(s.at(-1)?.fecha, '2026-05-12');
    assert.deepEqual(s[0], { fecha: '2026-04-13', ventas: 0n, gastos: 0n });
  });

  it('adds up to the same totals the hero shows', async () => {
    const [s, t] = await withBusiness(
      db,
      TENANT_A,
      async (tx) =>
        [
          await serieDiaria(tx, '2026-05-01', '2026-05-31'),
          await totalsForRange(tx, '2026-05-01', '2026-05-31'),
        ] as const,
    );
    assert.equal(
      s.reduce((a, d) => a + d.ventas, 0n),
      t.ventas,
    );
    assert.equal(
      s.reduce((a, d) => a + d.gastos, 0n),
      t.gastos,
    );
  });

  it('an empty range is an empty series', async () => {
    const s = await withBusiness(db, TENANT_A, (tx) => serieDiaria(tx, '2026-05-10', '2026-05-09'));
    assert.deepEqual(s, []);
  });
});
