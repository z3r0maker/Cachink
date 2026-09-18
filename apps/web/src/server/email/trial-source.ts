import 'server-only';

import type { SubscriptionRecord } from '@xangarro/application/billing';
import type { TrialSubscriptionSource } from '@xangarro/application/email';
import { subscriptions, subscriptionsOfBusinesses, type Db } from '@xangarro/data-pg';
import { and, gt, lte } from 'drizzle-orm';

/**
 * Read-only access to `subscriptions` for the trial emails (N-01, B-14), on
 * the `xangarro_billing` connection — the cron has no tenant claim, and that
 * role reads every row (0007_billing_grants.sql). Nothing here writes.
 *
 * `ofBusinesses` is billing's existing `subscriptionsOfBusinesses`; only the
 * trial-end window is a new read.
 */
const iso = (v: string | null): string | null => (v === null ? null : new Date(v).toISOString());

type Row = typeof subscriptions.$inferSelect;

export function toRecord(r: Omit<Row, 'createdAt' | 'updatedAt'>): SubscriptionRecord {
  return {
    stripeSubscriptionId: r.stripeSubscriptionId,
    businessId: r.businessId,
    stripeCustomerId: r.stripeCustomerId,
    planId: r.planId,
    interval: r.interval,
    status: r.status,
    stripeStatus: r.stripeStatus,
    trialEnd: iso(r.trialEnd),
    currentPeriodStart: iso(r.currentPeriodStart),
    currentPeriodEnd: iso(r.currentPeriodEnd),
    cancelAt: iso(r.cancelAt),
    collectionMethod: r.collectionMethod,
  };
}

export function pgTrialSource(db: Db): TrialSubscriptionSource {
  return {
    async between(from, to) {
      const rows = await db
        .select()
        .from(subscriptions)
        .where(and(gt(subscriptions.trialEnd, from), lte(subscriptions.trialEnd, to)));
      return rows.map(toRecord);
    },
    async ofBusinesses(ids) {
      return (await subscriptionsOfBusinesses(db, ids)).map(toRecord);
    },
  };
}
