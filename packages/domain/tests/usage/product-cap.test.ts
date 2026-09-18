import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  canCreateProduct,
  InvalidUsageCountError,
  InvalidUsageLimitsError,
  isFreePlan,
  usageMessageCode,
  type UsageLimits,
} from '../../src/usage/index.js';

const FREE: UsageLimits = { transactionsPerMonth: 300, activeProducts: 50 };
const PAID: UsageLimits = { transactionsPerMonth: 10_000, activeProducts: 1_000 };

describe('canCreateProduct', () => {
  it('allows the 50th product on the free plan', () => {
    assert.deepEqual(canCreateProduct(49, FREE, 'xangarrito'), { allowed: true });
  });

  it('refuses the 51st product on the free plan with a neutral code', () => {
    assert.deepEqual(canCreateProduct(50, FREE, 'xangarrito'), {
      allowed: false,
      code: 'PRODUCT_CAP_REACHED',
      limit: 50,
      excess: 1,
    });
  });

  it('reports how many an import would exceed by', () => {
    const r = canCreateProduct(45, FREE, 'xangarrito', 12);
    assert.deepEqual(r, { allowed: false, code: 'PRODUCT_CAP_REACHED', limit: 50, excess: 7 });
  });

  it('never refuses on a paid plan, even over the advisory limit', () => {
    assert.deepEqual(canCreateProduct(5_000, PAID, 'xangarro'), { allowed: true });
    assert.deepEqual(canCreateProduct(9_999, PAID, 'xangarrote', 100), { allowed: true });
  });

  it('allows anything when the free plan has no product limit', () => {
    const limits = { transactionsPerMonth: 300, activeProducts: null };
    assert.deepEqual(canCreateProduct(1_000, limits, 'xangarrito'), { allowed: true });
  });

  it('rejects negative or fractional counts with a typed error', () => {
    assert.throws(() => canCreateProduct(-1, FREE, 'xangarrito'), InvalidUsageCountError);
    assert.throws(() => canCreateProduct(1, FREE, 'xangarrito', 0), InvalidUsageCountError);
    assert.throws(() => canCreateProduct(1.5, FREE, 'xangarrito'), InvalidUsageCountError);
  });

  it('rejects invalid limits', () => {
    const bad = { transactionsPerMonth: 300, activeProducts: -5 };
    assert.throws(() => canCreateProduct(1, bad, 'xangarrito'), InvalidUsageLimitsError);
  });
});

describe('isFreePlan', () => {
  it('derives the free tier from the plan fallback, not a literal name', () => {
    assert.equal(isFreePlan('xangarrito'), true);
    assert.equal(isFreePlan('xangarro'), false);
    assert.equal(isFreePlan('xangarrote'), false);
  });
});

describe('usageMessageCode (ADR-069 neutral phone copy)', () => {
  it('returns the highest applicable code across metrics', () => {
    assert.equal(
      usageMessageCode({ transactions: 240, activeProducts: 0 }, FREE),
      'USAGE_NEAR_LIMIT',
    );
    assert.equal(usageMessageCode({ transactions: 0, activeProducts: 50 }, FREE), 'USAGE_AT_LIMIT');
    assert.equal(
      usageMessageCode({ transactions: 450, activeProducts: 41 }, FREE),
      'USAGE_AT_LIMIT',
    );
  });

  it('returns null below 80 % or when unlimited', () => {
    assert.equal(usageMessageCode({ transactions: 239, activeProducts: 39 }, FREE), null);
    const unlimited = { transactionsPerMonth: null, activeProducts: null };
    assert.equal(usageMessageCode({ transactions: 1e6, activeProducts: 1e6 }, unlimited), null);
  });
});
