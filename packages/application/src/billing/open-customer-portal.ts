/**
 * `openCustomerPortal` — "Administrar suscripción" (B-10 step 5).
 *
 * Stripe's hosted portal changes the plan, the card, or cancels. It never
 * offers SPEI (ADR-067); that button is the Suscripción screen's own.
 */

import type { UseCase } from '../_use-case.js';
import { BillingError } from './errors.js';
import type { BillingGateway, BillingRepository } from './ports.js';

export interface OpenCustomerPortalInput {
  readonly businessId: string;
  readonly returnUrl: string;
}

export class OpenCustomerPortalUseCase implements UseCase<OpenCustomerPortalInput, string> {
  readonly #repo: BillingRepository;
  readonly #gateway: BillingGateway;
  constructor(repo: BillingRepository, gateway: BillingGateway) {
    this.#repo = repo;
    this.#gateway = gateway;
  }

  /** Returns the portal session URL. */
  async execute(input: OpenCustomerPortalInput): Promise<string> {
    const customerId = await this.#repo.customerOf(input.businessId);
    if (customerId === null) throw new BillingError('NO_BILLING_CUSTOMER');
    return this.#gateway.createPortalSession(customerId, input.returnUrl);
  }
}
