/**
 * Limits and bands for the usage page (N-07), expressed with the domain's
 * usage core so the console and the N-03 notices can never disagree about
 * where 80 / 100 / 150 % fall.
 */
import type { PlanLimits } from '@xangarro/domain';
import {
  assertUsagePeriod,
  crossedThresholds,
  type UsageCounts,
  type UsageLimits,
  type UsageMetric,
  type UsagePeriod,
  type UsageThreshold,
} from '@xangarro/domain/usage';

/**
 * The plan's limits in the usage core's shape, from `PLAN_LIMITS` as it is
 * today: one metric, `recordsPerMonth`, and no product limit. C-12 adds
 * `transactionsPerMonth` and `activeProducts` to the plan table (ADR-065:
 * 300 / 50 · 10 000 / 1 000 · 30 000 / 5 000); this mapper is then replaced
 * by reading those two fields, and the page picks up the product column's
 * percentages with no other change.
 */
export function usageLimitsOf(plan: PlanLimits): UsageLimits {
  return { transactionsPerMonth: plan.recordsPerMonth, activeProducts: null };
}

export interface MetricUsage {
  readonly value: number;
  /** Null = unlimited. */
  readonly limit: number | null;
  /** Whole percent of the limit, rounded down; null when unlimited. */
  readonly percent: number | null;
  /** The highest ADR-065 threshold reached, or null below 80 %. */
  readonly band: UsageThreshold | null;
}

export type UsageByMetric = Readonly<Record<UsageMetric, MetricUsage>>;

/**
 * Each metric against its limit. The band is the highest threshold that
 * `crossedThresholds` reports for a first computation of the month — i.e.
 * exactly the notices N-03 would have fired by now.
 */
export function usageByMetric(
  counts: UsageCounts,
  limits: UsageLimits,
  period: UsagePeriod,
): UsageByMetric {
  assertUsagePeriod(period);
  const reached = crossedThresholds(null, { ...counts, businessId: '-', period }, limits);
  const one = (metric: UsageMetric, limit: number | null): MetricUsage => {
    const value = counts[metric];
    // Ordered by threshold within a metric, so the last one is the highest.
    const band = reached.filter((c) => c.metric === metric).at(-1)?.threshold ?? null;
    return {
      value,
      limit,
      percent: limit === null ? null : Math.floor((value * 100) / limit),
      band,
    };
  };
  return {
    transactions: one('transactions', limits.transactionsPerMonth),
    activeProducts: one('activeProducts', limits.activeProducts),
  };
}

/** The month before `period`. */
export function previousUsagePeriod(period: UsagePeriod): UsagePeriod {
  assertUsagePeriod(period);
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return month === 1
    ? `${String(year - 1).padStart(4, '0')}-12`
    : `${period.slice(0, 4)}-${String(month - 1).padStart(2, '0')}`;
}
