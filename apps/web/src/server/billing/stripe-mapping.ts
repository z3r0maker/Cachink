import type {
  BillingEvent,
  CollectionMethod,
  SubscriptionFacts,
} from '@xangarro/application/billing';
import type Stripe from 'stripe';

/**
 * Stripe objects → the application's shapes (B-10).
 *
 * Written against API version `2026-08-26.dahlia` (stripe 22.6.2): billing
 * periods live on subscription **items**, and an invoice names its
 * subscription under `parent.subscription_details`.
 */

const iso = (seconds: number | null | undefined): string | null =>
  seconds === null || seconds === undefined ? null : new Date(seconds * 1000).toISOString();

type Ref = string | { id: string } | null | undefined;
const idOf = (ref: Ref): string | null =>
  ref === null || ref === undefined ? null : typeof ref === 'string' ? ref : ref.id;

function collection(method: string | null | undefined): CollectionMethod {
  return method === 'send_invoice' ? 'send_invoice' : 'charge_automatically';
}

export function subscriptionFacts(sub: Stripe.Subscription): SubscriptionFacts {
  const item = sub.items.data[0];
  return {
    id: sub.id,
    customerId: idOf(sub.customer) ?? '',
    businessId: sub.metadata?.business_id ?? null,
    lookupKey: item?.price.lookup_key ?? null,
    stripeStatus: sub.status,
    trialEnd: iso(sub.trial_end),
    currentPeriodStart: iso(item?.current_period_start),
    currentPeriodEnd: iso(item?.current_period_end),
    cancelAt: iso(sub.cancel_at),
    collectionMethod: collection(sub.collection_method),
  };
}

function invoiceSubscription(invoice: Stripe.Invoice): string | null {
  return idOf(invoice.parent?.subscription_details?.subscription);
}

function invoiceEvent(
  id: string,
  type: 'invoice.paid' | 'invoice.payment_failed',
  invoice: Stripe.Invoice,
): BillingEvent | null {
  const customerId = idOf(invoice.customer);
  if (customerId === null) return null;
  const subscriptionId = invoiceSubscription(invoice);
  const tax = (invoice.total_taxes ?? []).reduce((sum, t) => sum + t.amount, 0);
  const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
  return {
    id,
    type,
    customerId,
    subscriptionId,
    invoice: {
      stripeInvoiceId: invoice.id ?? '',
      stripeSubscriptionId: subscriptionId,
      // Stripe's MXN minor unit is the centavo: these are integer centavos.
      subtotalCentavos: invoice.subtotal,
      taxCentavos: tax,
      totalCentavos: invoice.total,
      currency: invoice.currency,
      paidAt: iso(paidAt) ?? new Date(0).toISOString(),
      collectionMethod: collection(invoice.collection_method),
    },
  };
}

/** The event billing acts on, or `null` for any other type — acknowledged and dropped. */
export function toBillingEvent(event: Stripe.Event): BillingEvent | null {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription') return null;
      return {
        id: event.id,
        type: event.type,
        businessId: session.client_reference_id,
        customerId: idOf(session.customer),
        subscriptionId: idOf(session.subscription),
      };
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return { id: event.id, type: event.type, subscriptionId: event.data.object.id };
    case 'invoice.paid':
    case 'invoice.payment_failed':
      return invoiceEvent(event.id, event.type, event.data.object);
    default:
      return null;
  }
}
