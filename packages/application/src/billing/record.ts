import { parseLookupKey } from './plans.js';
import type { SubscriptionFacts, SubscriptionRecord } from './ports.js';
import { nextStatus, type BillingTrigger } from './status.js';

/**
 * The `subscriptions` row for what Stripe says, or `null` when the price is
 * not one of ours — a price created by hand in the Dashboard must not grant a
 * plan by accident.
 */
export function recordFrom(
  facts: SubscriptionFacts,
  businessId: string,
  trigger: BillingTrigger,
): SubscriptionRecord | null {
  const price = parseLookupKey(facts.lookupKey);
  if (price === null) return null;
  return {
    stripeSubscriptionId: facts.id,
    businessId,
    stripeCustomerId: facts.customerId,
    planId: price.planId,
    interval: price.interval,
    status: nextStatus(facts.stripeStatus, trigger),
    stripeStatus: facts.stripeStatus,
    trialEnd: facts.trialEnd,
    currentPeriodStart: facts.currentPeriodStart,
    currentPeriodEnd: facts.currentPeriodEnd,
    cancelAt: facts.cancelAt,
    collectionMethod: facts.collectionMethod,
  };
}
