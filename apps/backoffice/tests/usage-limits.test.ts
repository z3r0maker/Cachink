import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PLAN_LIMITS } from '@xangarro/domain';
import { InvalidUsageLimitsError, InvalidUsagePeriodError } from '@xangarro/domain/usage';

import { usageByMetric, usageLimitsOf } from '@/server/usage/limits';

const FREE = usageLimitsOf(PLAN_LIMITS.xangarrito);
const tx = (transactions: number) => ({ transactions, activeProducts: 3 });

describe('usageByMetric', () => {
  it('bands at 80 / 100 / 150 % exactly where the N-03 notices fire', () => {
    const band = (n: number) => usageByMetric(tx(n), FREE, '2026-09').transactions.band;
    assert.equal(band(239), null);
    assert.equal(band(240), 80);
    assert.equal(band(299), 80);
    assert.equal(band(300), 100);
    assert.equal(band(449), 100);
    assert.equal(band(450), 150);
    assert.equal(band(5_000), 150);
  });

  it('reports whole percent, rounded down; both metrics limited since C-12', () => {
    const m = usageByMetric(tx(239), FREE, '2026-09');
    assert.equal(m.transactions.percent, 79);
    assert.equal(m.transactions.limit, 300);
    const productos = usageByMetric({ transactions: 1, activeProducts: 40 }, FREE, '2026-09');
    assert.equal(productos.activeProducts.percent, 80);
    assert.equal(productos.activeProducts.band, 80);
    assert.equal(productos.activeProducts.value, 40);
  });

  it('a high tier still bands, far above xangarrito', () => {
    const paid = usageLimitsOf(PLAN_LIMITS.xangarro);
    assert.equal(usageByMetric(tx(7_999), paid, '2026-09').transactions.band, null);
    assert.equal(usageByMetric(tx(10_000), paid, '2026-09').transactions.band, 100);
  });

  it('rejects a malformed period', () => {
    assert.throws(() => usageByMetric(tx(1), FREE, '2026-9'), InvalidUsagePeriodError);
  });

  it('rejects invalid limits', () => {
    const bad = { transactionsPerMonth: 0, activeProducts: null };
    assert.throws(() => usageByMetric(tx(1), bad, '2026-09'), InvalidUsageLimitsError);
  });
});
