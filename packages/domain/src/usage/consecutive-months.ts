/**
 * "Sugerir upgrade" (N-03, ADR-065): the last two closed periods are both at
 * or over 100 % on any metric. The metric may differ between the months.
 */

import { anyMetricReaches, assertUsageLimits } from './limits.js';
import { assertUsagePeriod, nextUsagePeriod } from './usage-period.js';
import type { PeriodUsage, UsageLimits, UsagePeriod } from './types.js';

export interface ConsecutiveMonthsOptions {
  /** The open month; it and anything later are excluded from the check. */
  readonly currentPeriod?: UsagePeriod;
}

function closedPeriods(
  history: readonly PeriodUsage[],
  currentPeriod: UsagePeriod | undefined,
): PeriodUsage[] {
  for (const h of history) assertUsagePeriod(h.period);
  const closed =
    currentPeriod === undefined ? [...history] : history.filter((h) => h.period < currentPeriod);
  return closed.sort((a, b) => a.period.localeCompare(b.period));
}

export function consecutiveMonthsOver(
  history: readonly PeriodUsage[],
  limits: UsageLimits,
  options: ConsecutiveMonthsOptions = {},
): boolean {
  assertUsageLimits(limits);
  if (options.currentPeriod !== undefined) assertUsagePeriod(options.currentPeriod);
  const closed = closedPeriods(history, options.currentPeriod);
  const last = closed.at(-1);
  const beforeLast = closed.at(-2);
  if (last === undefined || beforeLast === undefined) return false;
  if (nextUsagePeriod(beforeLast.period) !== last.period) return false;
  return anyMetricReaches(beforeLast, limits, 100) && anyMetricReaches(last, limits, 100);
}
