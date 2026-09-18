/**
 * `startSpeiAnnual` — "Pagar por transferencia" (N-01, ADR-067).
 *
 * SPEI is offered on the **annual** interval only, and not through Checkout
 * or the Customer Portal: it is an API-created subscription with
 * `collection_method: 'send_invoice'` paid from the customer's balance, to a
 * per-customer CLABE Stripe issues and reconciles. The owner is sent to the
 * hosted invoice, which shows the CLABE and the IVA-inclusive total.
 *
 * A business still in its card-less trial may switch: the trial is cancelled
 * once the SPEI subscription exists, so there is never a moment with neither.
 */

import type { UseCase } from '../_use-case.js';
import { BillingError } from './errors.js';
import { assertPaidPlan, ensureCustomer, type BillingBusiness } from './customer.js';
import { lookupKey, SPEI_DAYS_UNTIL_DUE } from './plans.js';
import type { BillingGateway, BillingRepository } from './ports.js';
import { recordFrom } from './record.js';
import { currentSubscription } from './status.js';

export interface StartSpeiAnnualInput {
  readonly business: BillingBusiness;
  readonly plan: string;
}

export class StartSpeiAnnualUseCase implements UseCase<StartSpeiAnnualInput, string> {
  readonly #repo: BillingRepository;
  readonly #gateway: BillingGateway;
  constructor(repo: BillingRepository, gateway: BillingGateway) {
    this.#repo = repo;
    this.#gateway = gateway;
  }

  /** Returns the hosted invoice URL. */
  async execute(input: StartSpeiAnnualInput): Promise<string> {
    const plan = assertPaidPlan(input.plan);
    const current = currentSubscription(await this.#repo.subscriptionsOf(input.business.id));
    if (current !== null && current.status !== 'lapsed' && current.status !== 'trialing') {
      throw new BillingError('ALREADY_SUBSCRIBED');
    }

    const customerId = await ensureCustomer(this.#repo, this.#gateway, input.business);
    const { subscription, hostedInvoiceUrl } = await this.#gateway.createSpeiSubscription({
      customerId,
      businessId: input.business.id,
      lookupKey: lookupKey(plan, 'year'),
      daysUntilDue: SPEI_DAYS_UNTIL_DUE,
    });
    const record = recordFrom(subscription, input.business.id, 'sync');
    if (record !== null) await this.#repo.saveSubscription(record);
    if (current?.status === 'trialing') {
      await this.#gateway.cancelSubscription(current.stripeSubscriptionId);
    }
    return hostedInvoiceUrl;
  }
}
