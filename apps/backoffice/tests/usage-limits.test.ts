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
    assert.equal(band(39), null);
    assert.equal(band(40), 80);
    assert.equal(band(49), 80);
    assert.equal(band(50), 100);
    assert.equal(band(74), 100);
    assert.equal(band(75), 150);
    assert.equal(band(5_000), 150);
  });

  it('reports whole percent, rounded down, and no percent for unlimited', () => {
    const m = usageByMetric(tx(39), FREE, '2026-09');
    assert.equal(m.transactions.percent, 78);
    assert.equal(m.transactions.limit, 50);
    assert.equal(m.activeProducts.percent, null);
    assert.equal(m.activeProducts.band, null);
    assert.equal(m.activeProducts.value, 3);
  });

  it('never bands an unlimited metric, however large', () => {
    const paid = usageLimitsOf(PLAN_LIMITS.xangarro);
    assert.equal(usageByMetric(tx(1_000_000), paid, '2026-09').transactions.band, null);
  });

  it('rejects a malformed period', () => {
    assert.throws(() => usageByMetric(tx(1), FREE, '2026-9'), InvalidUsagePeriodError);
  });

  it('rejects invalid limits', () => {
    const bad = { transactionsPerMonth: 0, activeProducts: null };
    assert.throws(() => usageByMetric(tx(1), bad, '2026-09'), InvalidUsageLimitsError);
  });
});
