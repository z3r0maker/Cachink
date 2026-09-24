/**
 * `startTrialCheckout` — the paid-plan button of onboarding and Suscripción
 * (B-10, N-01, N-13 seam). The name predates ADR-105 and is kept so the seam's
 * wiring does not move.
 *
 * A card-only Stripe Checkout for a paid plan on either interval. **There is no
 * trial** (ADR-105): Xangarro is either free (Xangarrito) or paid, so every
 * paid subscription starts charging on day one.
 */

import type { UseCase } from '../_use-case.js';
import { BillingError } from './errors.js';
import {
  assertInterval,
  assertPaidPlan,
  ensureCustomer,
  type BillingBusiness,
} from './customer.js';
import { lookupKey } from './plans.js';
import type { BillingGateway, BillingRepository } from './ports.js';
import { currentSubscription, isLive } from './status.js';

export interface StartTrialCheckoutInput {
  readonly business: BillingBusiness;
  readonly plan: string;
  readonly interval: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

export class StartTrialCheckoutUseCase implements UseCase<StartTrialCheckoutInput, string> {
  readonly #repo: BillingRepository;
  readonly #gateway: BillingGateway;
  constructor(repo: BillingRepository, gateway: BillingGateway) {
    this.#repo = repo;
    this.#gateway = gateway;
  }

  /** Returns the Checkout URL to redirect the owner to. */
  async execute(input: StartTrialCheckoutInput): Promise<string> {
    const plan = assertPaidPlan(input.plan);
    const interval = assertInterval(input.interval);
    const history = await this.#repo.subscriptionsOf(input.business.id);
    if (isLive(currentSubscription(history))) throw new BillingError('ALREADY_SUBSCRIBED');

    const customerId = await ensureCustomer(this.#repo, this.#gateway, input.business);
    return this.#gateway.createCheckoutSession({
      customerId,
      businessId: input.business.id,
      lookupKey: lookupKey(plan, interval),
      trialDays: null,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });
  }
}
