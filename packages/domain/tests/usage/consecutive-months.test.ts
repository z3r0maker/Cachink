import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  consecutiveMonthsOver,
  InvalidUsagePeriodError,
  type PeriodUsage,
  type UsageLimits,
} from '../../src/usage/index.js';

const LIMITS: UsageLimits = { transactionsPerMonth: 300, activeProducts: 50 };

function month(period: string, transactions: number, activeProducts = 0): PeriodUsage {
  return { period, transactions, activeProducts };
}

describe('consecutiveMonthsOver', () => {
  it('is true when the last two closed months are at or over 100 %', () => {
    const history = [month('2026-06', 10), month('2026-07', 300), month('2026-08', 450)];
    assert.equal(consecutiveMonthsOver(history, LIMITS), true);
  });

  it('may mix metrics across the two months', () => {
    const history = [month('2026-07', 300, 1), month('2026-08', 1, 50)];
    assert.equal(consecutiveMonthsOver(history, LIMITS), true);
  });

  it('ignores the open month when told which one is current', () => {
    const history = [month('2026-07', 300), month('2026-08', 10), month('2026-09', 900)];
    assert.equal(consecutiveMonthsOver(history, LIMITS, { currentPeriod: '2026-09' }), false);
    const over = [month('2026-07', 300), month('2026-08', 301), month('2026-09', 1)];
    assert.equal(consecutiveMonthsOver(over, LIMITS, { currentPeriod: '2026-09' }), true);
  });

  it('is false when only one of the two months is over', () => {
    const history = [month('2026-07', 299), month('2026-08', 450)];
    assert.equal(consecutiveMonthsOver(history, LIMITS), false);
  });

  it('is false when the two months are not consecutive', () => {
    const history = [month('2026-05', 400), month('2026-08', 450)];
    assert.equal(consecutiveMonthsOver(history, LIMITS), false);
  });

  it('is false with fewer than two closed months or unlimited plans', () => {
    assert.equal(consecutiveMonthsOver([month('2026-08', 999)], LIMITS), false);
    const unlimited = { transactionsPerMonth: null, activeProducts: null };
    const history = [month('2026-07', 9e6), month('2026-08', 9e6)];
    assert.equal(consecutiveMonthsOver(history, unlimited), false);
  });

  it('sorts unordered history before deciding', () => {
    const history = [month('2026-08', 450), month('2026-06', 1), month('2026-07', 300)];
    assert.equal(consecutiveMonthsOver(history, LIMITS), true);
  });

  it('rejects a malformed period', () => {
    assert.throws(
      () => consecutiveMonthsOver([month('2026-7', 1), month('2026-08', 1)], LIMITS),
      InvalidUsagePeriodError,
    );
  });
});
