import { billingStatusSnapshot, type SubscriptionRecord } from '@xangarro/application/billing';
import type { BusinessId } from '@xangarro/domain';

import type { BillingFilter, BillingSnapshot } from './port';

/**
 * What the tenant list shows for one business's subscription rows (N-06),
 * from the same `billingStatusSnapshot` rule the portal uses — so the console
 * and the portal can never disagree about a tenant's Stripe state. No rows is
 * the free plan, which is now a known fact rather than «Sin datos».
 */
export const FREE_BILLING: BillingSnapshot = {
  planId: 'xangarrito',
  status: 'free',
  interval: null,
  currentPeriodEnd: null,
  stripeCustomerId: null,
};

export function snapshotOf(rows: readonly SubscriptionRecord[]): BillingSnapshot {
  const s = billingStatusSnapshot(rows);
  if (s === null) return FREE_BILLING;
  return {
    planId: s.planId,
    status: s.status,
    interval: s.interval,
    currentPeriodEnd: s.currentPeriodEnd,
    stripeCustomerId: s.stripeCustomerId,
  };
}

/** Group rows by business; every id asked for gets a snapshot. */
export function snapshotsFor(
  ids: readonly BusinessId[],
  rows: readonly SubscriptionRecord[],
): Map<BusinessId, BillingSnapshot> {
  const byBusiness = new Map<string, SubscriptionRecord[]>();
  for (const r of rows) byBusiness.set(r.businessId, [...(byBusiness.get(r.businessId) ?? []), r]);
  return new Map(ids.map((id) => [id, snapshotOf(byBusiness.get(id) ?? [])]));
}

export function matchesFilter(s: BillingSnapshot, f: BillingFilter): boolean {
  return (
    (f.plan === undefined || s.planId === f.plan) &&
    (f.status === undefined || s.status === f.status)
  );
}
