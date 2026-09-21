/**
 * What a business may do right now, as the phone will be told (B-06).
 *
 * Pure: the subscription and the clock come in, the payload goes out. Signing
 * is the server's (`signEntitlement`), so this runs anywhere — including the
 * tests, which is the point.
 *
 * Q14: a paid plan that has run out is issued **as the free plan**, never as an
 * expired paid token. The phone keeps working with fewer limits; nothing is
 * locked and nothing is deleted.
 */

import {
  FALLBACK_PLAN,
  MissingPeriodEndError,
  PLAN_IDS,
  PLAN_LIMITS,
  UnknownPlanError,
  type Entitlement,
  type PlanId,
} from '@xangarro/domain';

export const SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'grace',
  'lapsed',
  'free',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** The billing facts the entitlement depends on — nothing else from the row. */
export interface SubscriptionSnapshot {
  readonly planId: string;
  readonly status: SubscriptionStatus;
  /** ISO-8601; `null` only for the free plan. */
  readonly currentPeriodEnd: string | null;
}

const DAY = 86_400_000;
/** After the period ends, how long the paid plan still holds. */
export const GRACE_DAYS = 7;
/** "Forever", for a plan that never expires. */
const FREE_VALIDITY_DAYS = 36_500;

function knownPlan(planId: string): PlanId {
  if (!(PLAN_IDS as readonly string[]).includes(planId)) throw new UnknownPlanError(planId);
  return planId as PlanId;
}

function payload(
  businessId: string,
  plan: PlanId,
  validUntil: number,
  graceUntil: number,
  now: Date,
): Entitlement {
  const limits = PLAN_LIMITS[plan];
  return {
    businessId,
    plan,
    limits: {
      operators: limits.operators,
      devices: limits.devices,
      transactionsPerMonth: limits.transactionsPerMonth,
      activeProducts: limits.activeProducts,
    },
    features: [...limits.features],
    capabilities: { ...limits.capabilities },
    validUntil: new Date(validUntil).toISOString(),
    graceUntil: new Date(graceUntil).toISOString(),
    issuedAt: now.toISOString(),
    serverTime: now.toISOString(),
    version: 1,
  };
}

function free(businessId: string, now: Date): Entitlement {
  const forever = now.getTime() + FREE_VALIDITY_DAYS * DAY;
  return payload(businessId, FALLBACK_PLAN, forever, forever, now);
}

export function computeEntitlement(
  businessId: string,
  subscription: SubscriptionSnapshot | null,
  now: Date,
): Entitlement {
  if (subscription === null) return free(businessId, now);
  const plan = knownPlan(subscription.planId);
  if (subscription.status === 'lapsed' || subscription.status === 'free') {
    return free(businessId, now);
  }
  if (subscription.currentPeriodEnd === null) throw new MissingPeriodEndError(subscription.status);

  const validUntil = Date.parse(subscription.currentPeriodEnd);
  const graceUntil = validUntil + GRACE_DAYS * DAY;
  // Past grace is lapsed, whatever the billing row has caught up to saying.
  if (now.getTime() >= graceUntil) return free(businessId, now);
  return payload(businessId, plan, validUntil, graceUntil, now);
}
