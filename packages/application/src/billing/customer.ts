import { BillingError } from './errors.js';
import { isInterval, isPaidPlan, type BillingInterval, type PaidPlanId } from './plans.js';
import type { BillingGateway, BillingRepository } from './ports.js';

/** Who is buying: the business and its owner, from the signed session. */
export interface BillingBusiness {
  readonly id: string;
  readonly name: string;
  /** The owner's email: Stripe sends receipts and SPEI instructions here. */
  readonly email: string;
}

export function assertPaidPlan(plan: string): PaidPlanId {
  if (!isPaidPlan(plan)) throw new BillingError('NOT_A_PAID_PLAN');
  return plan;
}

export function assertInterval(interval: string): BillingInterval {
  if (!isInterval(interval)) throw new BillingError('INVALID_INTERVAL');
  return interval;
}

/** The business's Stripe customer, created the first time it buys anything. */
export async function ensureCustomer(
  repo: BillingRepository,
  gateway: BillingGateway,
  business: BillingBusiness,
): Promise<string> {
  const existing = await repo.customerOf(business.id);
  if (existing !== null) return existing;
  if (business.email.trim() === '') throw new BillingError('MISSING_EMAIL');
  const customerId = await gateway.createCustomer({
    businessId: business.id,
    email: business.email.trim(),
    name: business.name,
  });
  await repo.saveCustomer(business.id, customerId);
  return customerId;
}
