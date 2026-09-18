/**
 * `applyStripeEvent` — the webhook's use case (B-10 step 3).
 *
 * 1. **Idempotent by event id.** The ledger records the event before anything
 *    else; a processed event is a `duplicate` and changes nothing. One that
 *    failed runs again when Stripe retries it.
 * 2. **Stripe is the truth.** The subscription is re-read from Stripe, mapped
 *    by `nextStatus` and written whole — never patched from a possibly stale
 *    payload.
 * 3. **The entitlement is recomputed** by `computeEntitlement` over the
 *    business's rows and returned; phones receive it on their next pull. The
 *    `EntitlementListener` hears it (N-13 applies pending paid answers).
 * 4. **`invoice.paid` is told to the CFDI port** (ADR-070).
 *
 * Events that cannot be tied to a business or a known price are recorded as
 * processed with a note, not failed: retrying would not make them ours.
 */

import type { Entitlement } from '@xangarro/domain';
import type { BillingEvent, InvoiceEvent } from './events.js';
import type {
  BillingGateway,
  BillingRepository,
  BillingStatus,
  EntitlementListener,
  InvoicePaidListener,
  StripeEventLedger,
} from './ports.js';
import { recordFrom } from './record.js';
import { entitlementFromBilling, type BillingTrigger } from './status.js';

export type ApplyStripeEventResult =
  | { readonly outcome: 'duplicate' }
  | { readonly outcome: 'ignored'; readonly reason: string }
  | {
      readonly outcome: 'applied';
      readonly businessId: string;
      readonly status: BillingStatus | null;
      readonly entitlement: Entitlement;
    };

export interface ApplyStripeEventDeps {
  readonly repo: BillingRepository;
  readonly ledger: StripeEventLedger;
  readonly gateway: BillingGateway;
  readonly invoices: InvoicePaidListener;
  readonly entitlements: EntitlementListener;
  readonly now: () => Date;
}

const TRIGGER: Readonly<Record<BillingEvent['type'], BillingTrigger>> = {
  'checkout.session.completed': 'sync',
  'customer.subscription.created': 'sync',
  'customer.subscription.updated': 'sync',
  'customer.subscription.deleted': 'deleted',
  'invoice.paid': 'paid',
  'invoice.payment_failed': 'failed',
};

type Handled = ApplyStripeEventResult & { readonly outcome: 'applied' | 'ignored' };

export class ApplyStripeEventUseCase {
  readonly #deps: ApplyStripeEventDeps;
  constructor(deps: ApplyStripeEventDeps) {
    this.#deps = deps;
  }

  async execute(event: BillingEvent): Promise<ApplyStripeEventResult> {
    const { ledger } = this.#deps;
    if ((await ledger.begin(event.id, event.type)) === 'done') return { outcome: 'duplicate' };
    try {
      const result = await this.#handle(event);
      await ledger.finish(event.id, result.outcome === 'ignored' ? result.reason : null);
      return result;
    } catch (error) {
      await ledger.fail(event.id, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async #handle(event: BillingEvent): Promise<Handled> {
    if (event.type === 'checkout.session.completed') {
      if (event.businessId !== null && event.customerId !== null) {
        await this.#rememberCustomer(event.businessId, event.customerId);
      }
      if (event.subscriptionId === null) return { outcome: 'ignored', reason: 'NO_SUBSCRIPTION' };
      return this.#sync(event.subscriptionId, 'sync', event.businessId);
    }
    if ('invoice' in event) return this.#invoice(event);
    return this.#sync(event.subscriptionId, TRIGGER[event.type], null);
  }

  async #rememberCustomer(businessId: string, customerId: string): Promise<void> {
    const { repo } = this.#deps;
    if ((await repo.customerOf(businessId)) === null)
      await repo.saveCustomer(businessId, customerId);
  }

  async #sync(
    subscriptionId: string,
    trigger: BillingTrigger,
    hint: string | null,
  ): Promise<Handled> {
    const { repo, gateway, entitlements, now } = this.#deps;
    const facts = await gateway.retrieveSubscription(subscriptionId);
    const businessId =
      facts.businessId ?? hint ?? (await repo.businessOfCustomer(facts.customerId));
    if (businessId === null) return { outcome: 'ignored', reason: 'UNKNOWN_BUSINESS' };
    const record = recordFrom(facts, businessId, trigger);
    if (record === null) return { outcome: 'ignored', reason: 'UNKNOWN_PRICE' };
    await repo.saveSubscription(record);
    const entitlement = entitlementFromBilling(
      businessId,
      await repo.subscriptionsOf(businessId),
      now(),
    );
    await entitlements.onEntitlementChanged(businessId, entitlement);
    return { outcome: 'applied', businessId, status: record.status, entitlement };
  }

  async #invoice(event: InvoiceEvent): Promise<Handled> {
    const { repo, invoices, now } = this.#deps;
    const synced =
      event.subscriptionId === null
        ? null
        : await this.#sync(event.subscriptionId, TRIGGER[event.type], null);
    if (synced?.outcome === 'applied' && event.type === 'invoice.payment_failed') return synced;

    const businessId =
      synced?.outcome === 'applied'
        ? synced.businessId
        : await repo.businessOfCustomer(event.customerId);
    if (businessId === null) return { outcome: 'ignored', reason: 'UNKNOWN_BUSINESS' };
    if (event.type === 'invoice.paid')
      await invoices.onInvoicePaid({ ...event.invoice, businessId });
    if (synced?.outcome === 'applied') return synced;
    const entitlement = entitlementFromBilling(
      businessId,
      await repo.subscriptionsOf(businessId),
      now(),
    );
    return { outcome: 'applied', businessId, status: null, entitlement };
  }
}
