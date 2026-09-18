/**
 * The subscription state machine (B-10), as pure functions.
 *
 * Stripe decides the status; we map it to the four words the entitlement
 * understands and let the triggering event nudge it where Stripe's own update
 * may land a moment later. The *time* rules — 7-day payment grace, lapse to
 * the free plan — are `computeEntitlement`'s, not repeated here.
 */

import { computeEntitlement, type SubscriptionSnapshot } from '../compute-entitlement/index.js';
import type { Entitlement } from '@xangarro/domain';
import type { BillingInterval, PaidPlanId } from './plans.js';
import type { BillingStatus, SubscriptionRecord } from './ports.js';

/** What happened, besides "here is the subscription now". */
export type BillingTrigger = 'sync' | 'paid' | 'failed' | 'deleted';

const FROM_STRIPE: Readonly<Record<string, BillingStatus>> = {
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
};

/**
 * `unpaid`, `canceled`, `incomplete_expired`, `paused` — and `incomplete`, a
 * first payment not yet made — all entitle nothing: lapsed.
 */
export function nextStatus(stripeStatus: string, trigger: BillingTrigger): BillingStatus {
  if (trigger === 'deleted') return 'lapsed';
  const status = FROM_STRIPE[stripeStatus] ?? 'lapsed';
  if (trigger === 'failed' && status === 'active') return 'past_due';
  if (trigger === 'paid' && status === 'past_due') return 'active';
  return status;
}

const RANK: Readonly<Record<BillingStatus, number>> = {
  active: 0,
  trialing: 1,
  past_due: 2,
  lapsed: 3,
};

/**
 * The subscription that speaks for the business: the best status, then the
 * latest period. A trial being replaced by a paid SPEI year has two rows until
 * Stripe cancels the trial; the paid one wins whichever event arrives first.
 */
export function currentSubscription(
  rows: readonly SubscriptionRecord[],
): SubscriptionRecord | null {
  const sorted = [...rows].sort(
    (a, b) =>
      RANK[a.status] - RANK[b.status] ||
      (b.currentPeriodEnd ?? '').localeCompare(a.currentPeriodEnd ?? ''),
  );
  return sorted[0] ?? null;
}

/**
 * The row as `computeEntitlement` reads it. Which instant the grace counts
 * from depends on the status:
 * - trialing — the trial's end; after it, 7 days of grace to add a card.
 * - past_due — when the unpaid period *began*. Stripe has already advanced
 *   `current_period_end` a month (or a year); counting from it would give a
 *   non-payer the whole new period.
 */
export function toSnapshot(record: SubscriptionRecord | null): SubscriptionSnapshot | null {
  if (record === null) return null;
  const end = {
    trialing: record.trialEnd ?? record.currentPeriodEnd,
    active: record.currentPeriodEnd,
    past_due: record.currentPeriodStart ?? record.currentPeriodEnd,
    lapsed: record.currentPeriodEnd,
  }[record.status];
  return { planId: record.planId, status: record.status, currentPeriodEnd: end };
}

/** The entitlement a business has from its billing rows — no rows is the free plan. */
export function entitlementFromBilling(
  businessId: string,
  rows: readonly SubscriptionRecord[],
  now: Date,
): Entitlement {
  return computeEntitlement(businessId, toSnapshot(currentSubscription(rows)), now);
}

/** A live subscription blocks starting another one. */
export function isLive(record: SubscriptionRecord | null): boolean {
  return record !== null && record.status !== 'lapsed';
}

/**
 * The shape the admin console's `BillingStatusSource` port reads (N-06,
 * `apps/admin/src/server/billing/port.ts`): a business with no rows is the
 * adapter's `UNKNOWN_BILLING`, so `null` here.
 */
export interface BillingStatusSnapshot {
  readonly planId: PaidPlanId;
  readonly status: BillingStatus;
  readonly interval: BillingInterval;
  /** Next charge, or the trial's end while trialing. */
  readonly currentPeriodEnd: string | null;
  readonly stripeCustomerId: string;
}

export function billingStatusSnapshot(
  rows: readonly SubscriptionRecord[],
): BillingStatusSnapshot | null {
  const current = currentSubscription(rows);
  if (current === null) return null;
  return {
    planId: current.planId,
    status: current.status,
    interval: current.interval,
    currentPeriodEnd:
      current.status === 'trialing'
        ? (current.trialEnd ?? current.currentPeriodEnd)
        : current.currentPeriodEnd,
    stripeCustomerId: current.stripeCustomerId,
  };
}
