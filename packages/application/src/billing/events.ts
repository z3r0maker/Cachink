/**
 * The Stripe webhook events billing acts on, reduced to the fields it reads.
 *
 * The portal translates a verified `Stripe.Event` into one of these; any other
 * event type is acknowledged and dropped there. Subscriptions are always
 * re-read from Stripe when handled, so out-of-order delivery cannot roll a
 * subscription back to an older state.
 */

import type { PaidInvoice } from './ports.js';

export const HANDLED_EVENT_TYPES = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
] as const;
export type HandledEventType = (typeof HANDLED_EVENT_TYPES)[number];

interface EventBase {
  /** `evt_…` — the idempotency key. */
  readonly id: string;
}

export interface CheckoutCompleted extends EventBase {
  readonly type: 'checkout.session.completed';
  /** `client_reference_id`. */
  readonly businessId: string | null;
  readonly customerId: string | null;
  readonly subscriptionId: string | null;
}

export interface SubscriptionChanged extends EventBase {
  readonly type:
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted';
  readonly subscriptionId: string;
}

export interface InvoiceEvent extends EventBase {
  readonly type: 'invoice.paid' | 'invoice.payment_failed';
  readonly customerId: string;
  readonly subscriptionId: string | null;
  /** The payment, for the CFDI flow; `businessId` is resolved while handling. */
  readonly invoice: Omit<PaidInvoice, 'businessId'>;
}

export type BillingEvent = CheckoutCompleted | SubscriptionChanged | InvoiceEvent;

export function isHandledEventType(type: string): type is HandledEventType {
  return (HANDLED_EVENT_TYPES as readonly string[]).includes(type);
}
