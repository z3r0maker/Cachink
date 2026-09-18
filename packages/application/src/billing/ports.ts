/**
 * What billing needs from the outside world, as interfaces (B-10).
 *
 * The application never imports the Stripe SDK or Postgres: the portal
 * implements `BillingGateway` over `stripe` and `BillingRepository` /
 * `StripeEventLedger` over `@xangarro/data-pg`, and the tests use fakes.
 * All times are ISO-8601 strings; `null` means Stripe had none.
 */

import type { Entitlement } from '@xangarro/domain';
import type { BillingInterval, PaidPlanId } from './plans.js';

/** Our reading of Stripe's status: `SubscriptionStatus` minus `grace`/`free`. */
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'lapsed';
export type CollectionMethod = 'charge_automatically' | 'send_invoice';

/** A Stripe subscription as Stripe says it is right now. */
export interface SubscriptionFacts {
  readonly id: string;
  readonly customerId: string;
  /** `metadata.business_id`, set by every subscription we create. */
  readonly businessId: string | null;
  /** The first item's price lookup key. */
  readonly lookupKey: string | null;
  readonly stripeStatus: string;
  readonly trialEnd: string | null;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly cancelAt: string | null;
  readonly collectionMethod: CollectionMethod;
}

/** One row of `subscriptions`. */
export interface SubscriptionRecord {
  readonly stripeSubscriptionId: string;
  readonly businessId: string;
  readonly stripeCustomerId: string;
  readonly planId: PaidPlanId;
  readonly interval: BillingInterval;
  readonly status: BillingStatus;
  readonly stripeStatus: string;
  readonly trialEnd: string | null;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly cancelAt: string | null;
  readonly collectionMethod: CollectionMethod;
}

export interface BillingRepository {
  customerOf(businessId: string): Promise<string | null>;
  saveCustomer(businessId: string, stripeCustomerId: string): Promise<void>;
  businessOfCustomer(stripeCustomerId: string): Promise<string | null>;
  subscriptionsOf(businessId: string): Promise<readonly SubscriptionRecord[]>;
  /** Insert or replace by `stripeSubscriptionId`. */
  saveSubscription(record: SubscriptionRecord): Promise<void>;
}

/**
 * The idempotency ledger (`stripe_events`). `begin` records the event and says
 * whether it was already processed; an event recorded but never finished — a
 * crash, a failed write — is `retry` and runs again.
 */
export interface StripeEventLedger {
  begin(eventId: string, type: string): Promise<'new' | 'retry' | 'done'>;
  /** Processed; `note` says why nothing changed, when nothing did. */
  finish(eventId: string, note: string | null): Promise<void>;
  /** Failed; Stripe will retry it. */
  fail(eventId: string, error: string): Promise<void>;
}

export interface NewCustomer {
  readonly businessId: string;
  readonly email: string;
  readonly name: string;
}

export interface CheckoutRequest {
  readonly customerId: string;
  readonly businessId: string;
  readonly lookupKey: string;
  /** `null` when the business already had a trial. */
  readonly trialDays: number | null;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

export interface SpeiRequest {
  readonly customerId: string;
  readonly businessId: string;
  readonly lookupKey: string;
  readonly daysUntilDue: number;
}

export interface BillingGateway {
  createCustomer(customer: NewCustomer): Promise<string>;
  /** A card-only subscription Checkout; returns its URL. */
  createCheckoutSession(request: CheckoutRequest): Promise<string>;
  /** A send_invoice + customer_balance subscription; its first invoice finalized. */
  createSpeiSubscription(
    request: SpeiRequest,
  ): Promise<{ readonly subscription: SubscriptionFacts; readonly hostedInvoiceUrl: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  createPortalSession(customerId: string, returnUrl: string): Promise<string>;
  retrieveSubscription(subscriptionId: string): Promise<SubscriptionFacts>;
}

/** A paid Stripe invoice, as the CFDI flow (N-33, ADR-070) needs it. */
export interface PaidInvoice {
  readonly businessId: string;
  readonly stripeInvoiceId: string;
  readonly stripeSubscriptionId: string | null;
  readonly subtotalCentavos: number;
  readonly taxCentavos: number;
  readonly totalCentavos: number;
  readonly currency: string;
  readonly paidAt: string;
  readonly collectionMethod: CollectionMethod;
}

/**
 * Told about every paid invoice. N-08's ingestion will implement it by filing a
 * "pago sin CFDI" item in the admin inbox (ADR-070, `CFDI_MODE=off`); until
 * then the portal logs one `pago_sin_cfdi` line — the event itself stays in
 * `stripe_events`, so no payment is lost for the backfill. Implementations
 * must be idempotent per `stripeInvoiceId`: the ledger stops redelivery once
 * an event is processed, but two concurrent deliveries can both run.
 */
export interface InvoicePaidListener {
  onInvoicePaid(invoice: PaidInvoice): Promise<void>;
}

export const noopInvoicePaid: InvoicePaidListener = {
  onInvoicePaid: () => Promise.resolve(),
};

/**
 * Told whenever an event changed a business's subscription, with the
 * entitlement it now has. N-13 implements it to apply the wizard's pending
 * paid answers on upgrade (`AplicarConfiguracionUseCase` — idempotent — in a
 * tenant transaction); the default does nothing.
 */
export interface EntitlementListener {
  onEntitlementChanged(businessId: string, entitlement: Entitlement): Promise<void>;
}

export const noopEntitlementListener: EntitlementListener = {
  onEntitlementChanged: () => Promise.resolve(),
};
