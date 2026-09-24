import { entitlementFromBilling } from '@xangarro/application/billing';
import type {
  UsageCountSource,
  UsageCounterStore,
  UsageLimitsSource,
  UsageNoticeLedger,
} from '@xangarro/application/usage';
import { PLAN_LIMITS } from '@xangarro/domain';
import { usageLimitsOf, type UsageLimits } from '@xangarro/domain/usage';
import {
  beginUsageNotice,
  finishUsageNotice,
  saveUsageCounters,
  subscriptionsOfBusinesses,
  usageCounts,
  usageCountersOf,
  type Db,
  type SubscriptionRow,
} from '@xangarro/data-pg';

/**
 * The usage recompute's ports over Postgres (N-02 / N-03). Counts, counters
 * and the notice ledger run on the `xangarro_metering` connection; plans are
 * read from `subscriptions` on the billing one — the entitlement's own rule
 * (`entitlementFromBilling`), so a lapsed trial is metered as the free plan.
 */

export function pgUsageCounts(metering: Db): UsageCountSource {
  return {
    count: (first, last, businessIds) => usageCounts(metering, businessIds ?? null, first, last),
  };
}

export function pgUsageCounters(metering: Db): UsageCounterStore {
  return {
    save: (rows, computedAt) => saveUsageCounters(metering, rows, computedAt),
    history: (periods) => usageCountersOf(metering, periods),
  };
}

export function pgUsageNoticeLedger(metering: Db): UsageNoticeLedger {
  return {
    begin: (key, recipient, businessId) => beginUsageNotice(metering, key, recipient, businessId),
    finish: (key, recipient) => finishUsageNotice(metering, key, recipient),
  };
}

/** Each business's limits from its billing rows — no rows is the free plan. */
export function limitsFromSubscriptions(
  businessIds: readonly string[],
  rows: readonly SubscriptionRow[],
  now: Date,
): Map<string, UsageLimits> {
  const out = new Map<string, UsageLimits>();
  for (const id of businessIds) {
    const own = rows.filter((r) => r.businessId === id);
    const { plan } = entitlementFromBilling(id, own, now);
    out.set(id, usageLimitsOf(PLAN_LIMITS[plan]));
  }
  return out;
}

/** Chunked, so a large tenant count never builds one giant IN list. */
export function pgUsageLimits(billing: Db, now: () => Date): UsageLimitsSource {
  return {
    async limitsOf(businessIds) {
      const rows: SubscriptionRow[] = [];
      for (let i = 0; i < businessIds.length; i += 500) {
        rows.push(...(await subscriptionsOfBusinesses(billing, businessIds.slice(i, i + 500))));
      }
      return limitsFromSubscriptions(businessIds, rows, now());
    },
  };
}
