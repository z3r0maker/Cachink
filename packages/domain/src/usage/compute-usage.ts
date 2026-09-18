/**
 * Recompute a business's usage from source rows (the drift-proof nightly
 * path of N-02). Transactions are those in `period`; active products are a
 * point-in-time count of the catalog passed in.
 *
 * The caller decides which instant places a row in a period (`at`): the
 * push counter and the recompute must use the same one.
 */

import { countsTowardUsage } from './counts-toward-usage.js';
import { assertUsagePeriod, DEFAULT_USAGE_TIME_ZONE, usagePeriod } from './usage-period.js';
import type { UsageCounts, UsagePeriod, UsageRecord } from './types.js';

const INACTIVE_REVIEW = new Set(['rechazado', 'fusionado']);

function isActiveProduct(record: UsageRecord): boolean {
  if (record.kind !== 'producto' || record.deletedAt !== null) return false;
  return !INACTIVE_REVIEW.has(record.estadoRevision ?? 'aprobado');
}

function isTransactionIn(record: UsageRecord, period: UsagePeriod, timeZone: string): boolean {
  if (record.kind === 'producto' || !countsTowardUsage(record)) return false;
  return usagePeriod(record.at, timeZone) === period;
}

export function computeUsage(
  records: readonly UsageRecord[],
  period: UsagePeriod,
  timeZone: string = DEFAULT_USAGE_TIME_ZONE,
): UsageCounts {
  assertUsagePeriod(period);
  let transactions = 0;
  let activeProducts = 0;
  for (const record of records) {
    if (isActiveProduct(record)) activeProducts += 1;
    else if (isTransactionIn(record, period, timeZone)) transactions += 1;
  }
  return { transactions, activeProducts };
}
