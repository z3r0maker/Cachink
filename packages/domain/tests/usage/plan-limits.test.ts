import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PLAN_LIMITS } from '../../src/entities/plan.js';
import {
  InvalidUsagePeriodError,
  previousUsagePeriod,
  usageLimitsOf,
} from '../../src/usage/index.js';

/**
 * Shared by the admin console (N-07) and the nightly recompute (N-02/N-03),
 * so both read a plan's limits and step months the same way.
 */
describe('usageLimitsOf', () => {
  it('maps today’s recordsPerMonth to the transaction limit, products unlimited', () => {
    assert.deepEqual(usageLimitsOf(PLAN_LIMITS.xangarrito), {
      transactionsPerMonth: 50,
      activeProducts: null,
    });
    assert.deepEqual(usageLimitsOf(PLAN_LIMITS.xangarrote), {
      transactionsPerMonth: null,
      activeProducts: null,
    });
  });
});

describe('previousUsagePeriod', () => {
  it('steps back one month, across a year boundary', () => {
    assert.equal(previousUsagePeriod('2026-09'), '2026-08');
    assert.equal(previousUsagePeriod('2026-01'), '2025-12');
  });

  it('rejects a malformed period', () => {
    assert.throws(() => previousUsagePeriod('2026-13'), InvalidUsagePeriodError);
    assert.throws(() => previousUsagePeriod(''), InvalidUsagePeriodError);
  });
});
