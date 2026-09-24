/**
 * SolicitarPruebaUseCase — [Contratar este plan] on "Tu plan ideal" (N-13; no trial since ADR-105).
 *
 * Records the intent first, so a tap is never lost even while Checkout does
 * not exist, then asks the `TrialCheckout` port. Today the portal's port
 * answers `unavailable` and the screen says «Pronto podrás activar tu prueba»;
 * B-10 replaces the port with a Stripe Checkout session (14-day trial, no card
 * up front, ADR-067) and this use case does not change.
 */

import { PLAN_IDS, type BusinessId, type PlanId } from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';
import { SignupError } from './errors.js';
import {
  BILLING_INTERVALS,
  type BillingInterval,
  type OnboardingStore,
  type TrialCheckout,
  type TrialCheckoutResult,
} from './ports.js';

export interface SolicitarPruebaInput {
  readonly businessId: BusinessId;
  readonly plan: PlanId;
  readonly interval: BillingInterval;
}

const PAID_PLANS: readonly string[] = PLAN_IDS.slice(1);

export class SolicitarPruebaUseCase implements UseCase<SolicitarPruebaInput, TrialCheckoutResult> {
  readonly #store: OnboardingStore;
  readonly #checkout: TrialCheckout;

  constructor(store: OnboardingStore, checkout: TrialCheckout) {
    this.#store = store;
    this.#checkout = checkout;
  }

  async execute(input: SolicitarPruebaInput): Promise<TrialCheckoutResult> {
    const intervalOk = (BILLING_INTERVALS as readonly string[]).includes(input.interval);
    if (!PAID_PLANS.includes(input.plan) || !intervalOk) {
      throw new SignupError('NOT_A_PAID_PLAN', 'Solo los planes de pago se contratan; Xangarrito es gratis.');
    }
    const { businessId, plan, interval } = input;
    await this.#store.recordTrialIntent({ plan, interval, at: new Date().toISOString() });
    return this.#checkout.startTrialCheckout({ businessId, plan, interval });
  }
}
