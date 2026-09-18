/**
 * Limit arithmetic shared by thresholds, the upgrade suggestion and the
 * phone's neutral banner. Integer-only: `value * 100 >= limit * pct`.
 */

import { InvalidUsageLimitsError } from './errors.js';
import type { UsageCounts, UsageLimits, UsageMetric } from './types.js';

/** Throws unless every limit is `null` or a positive integer. */
export function assertUsageLimits(limits: UsageLimits): void {
  const pairs = [
    ['transactionsPerMonth', limits.transactionsPerMonth],
    ['activeProducts', limits.activeProducts],
  ] as const;
  for (const [metric, value] of pairs) {
    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
      throw new InvalidUsageLimitsError(metric, value);
    }
  }
}

export function limitFor(limits: UsageLimits, metric: UsageMetric): number | null {
  return metric === 'transactions' ? limits.transactionsPerMonth : limits.activeProducts;
}

/** True when `value` is at or above `pct` % of `limit`; never for unlimited. */
export function reaches(value: number, limit: number | null, pct: number): boolean {
  return limit !== null && value * 100 >= limit * pct;
}

/** True when any metric of `counts` is at or above `pct` % of its limit. */
export function anyMetricReaches(counts: UsageCounts, limits: UsageLimits, pct: number): boolean {
  return (
    reaches(counts.transactions, limits.transactionsPerMonth, pct) ||
    reaches(counts.activeProducts, limits.activeProducts, pct)
  );
}
