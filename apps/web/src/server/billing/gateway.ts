import type {
  BillingGateway,
  CheckoutRequest,
  NewCustomer,
  SpeiRequest,
} from '@xangarro/application/billing';
import type Stripe from 'stripe';

import { CatalogMissingError, findIvaRate, findPrice } from './catalog';
import { subscriptionFacts } from './stripe-mapping';

/**
 * `BillingGateway` over the Stripe SDK (B-10, N-01, ADR-067).
 *
 * - Checkout is **card only**, on either interval; the trial is sent with
 *   `payment_method_collection: 'if_required'`, so no card is asked for, and a
 *   trial that ends without one **cancels** (→ lapsed → the free plan).
 * - SPEI is an API-created `send_invoice` subscription paid from the
 *   customer's balance by Mexican bank transfer (a per-customer CLABE). No
 *   OXXO anywhere.
 * - Every line carries the 16 % IVA tax rate; prices are tax-exclusive.
 * - Every subscription carries `metadata.business_id`, which is how the
 *   webhook finds its tenant.
 */
async function priceAndTax(stripe: Stripe, key: string): Promise<{ price: string; tax: string }> {
  const [price, tax] = await Promise.all([findPrice(stripe, key), findIvaRate(stripe)]);
  if (price === null) throw new CatalogMissingError(`Price ${key}`);
  if (tax === null) throw new CatalogMissingError('The IVA tax rate');
  return { price: price.id, tax: tax.id };
}

function checkoutParams(
  r: CheckoutRequest,
  price: string,
  tax: string,
): Stripe.Checkout.SessionCreateParams {
  const metadata = { business_id: r.businessId };
  return {
    mode: 'subscription',
    customer: r.customerId,
    client_reference_id: r.businessId,
    line_items: [{ price, quantity: 1, tax_rates: [tax] }],
    payment_method_types: ['card'],
    payment_method_collection: 'if_required',
    subscription_data: {
      metadata,
      ...(r.trialDays === null
        ? {}
        : {
            trial_period_days: r.trialDays,
            trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
          }),
    },
    metadata,
    locale: 'es',
    success_url: r.successUrl,
    cancel_url: r.cancelUrl,
  };
}

async function hostedInvoiceUrl(stripe: Stripe, sub: Stripe.Subscription): Promise<string> {
  const latest = sub.latest_invoice;
  const id = typeof latest === 'string' ? latest : latest?.id;
  if (!id) throw new Error(`Subscription ${sub.id} has no invoice.`);
  let invoice = typeof latest === 'string' || !latest ? await stripe.invoices.retrieve(id) : latest;
  if (invoice.status === 'draft') invoice = await stripe.invoices.finalizeInvoice(id);
  if (!invoice.hosted_invoice_url) throw new Error(`Invoice ${id} has no hosted URL.`);
  return invoice.hosted_invoice_url;
}

async function createSpei(stripe: Stripe, r: SpeiRequest) {
  const { price, tax } = await priceAndTax(stripe, r.lookupKey);
  const sub = await stripe.subscriptions.create({
    customer: r.customerId,
    items: [{ price, tax_rates: [tax] }],
    collection_method: 'send_invoice',
    days_until_due: r.daysUntilDue,
    payment_settings: {
      payment_method_types: ['customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'mx_bank_transfer' },
        },
      },
    },
    metadata: { business_id: r.businessId },
    expand: ['latest_invoice'],
  });
  return {
    subscription: subscriptionFacts(sub),
    hostedInvoiceUrl: await hostedInvoiceUrl(stripe, sub),
  };
}

export function stripeGateway(stripe: Stripe): BillingGateway {
  return {
    async createCustomer(c: NewCustomer) {
      const customer = await stripe.customers.create({
        email: c.email,
        name: c.name,
        preferred_locales: ['es-419'],
        metadata: { business_id: c.businessId },
      });
      return customer.id;
    },
    async createCheckoutSession(r: CheckoutRequest) {
      const { price, tax } = await priceAndTax(stripe, r.lookupKey);
      const session = await stripe.checkout.sessions.create(checkoutParams(r, price, tax));
      if (!session.url) throw new Error('Checkout returned no URL.');
      return session.url;
    },
    createSpeiSubscription: (r: SpeiRequest) => createSpei(stripe, r),
    async cancelSubscription(id: string) {
      await stripe.subscriptions.cancel(id);
    },
    async createPortalSession(customer: string, returnUrl: string) {
      const session = await stripe.billingPortal.sessions.create({
        customer,
        return_url: returnUrl,
      });
      return session.url;
    },
    async retrieveSubscription(id: string) {
      return subscriptionFacts(await stripe.subscriptions.retrieve(id));
    },
  };
}
