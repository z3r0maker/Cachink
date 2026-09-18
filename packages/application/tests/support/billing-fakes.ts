/**
 * In-memory billing ports for the use-case tests. The gateway records what it
 * was asked and answers from `subscriptions`, like a tiny Stripe.
 */

import type {
  BillingGateway,
  BillingRepository,
  CheckoutRequest,
  InvoicePaidListener,
  PaidInvoice,
  SpeiRequest,
  StripeEventLedger,
  SubscriptionFacts,
  SubscriptionRecord,
} from '../../src/billing/index.js';

export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
export const NOW = new Date('2026-09-17T12:00:00.000Z');
const DAY = 86_400_000;
export const at = (days: number) => new Date(NOW.getTime() + days * DAY).toISOString();

export const business = { id: BIZ, name: 'Taquería Don Pedro', email: 'pedro@example.mx' };

export function facts(overrides: Partial<SubscriptionFacts> = {}): SubscriptionFacts {
  return {
    id: 'sub_1',
    customerId: 'cus_1',
    businessId: BIZ,
    lookupKey: 'plan_xangarro_monthly',
    stripeStatus: 'active',
    trialEnd: null,
    currentPeriodStart: at(-10),
    currentPeriodEnd: at(20),
    cancelAt: null,
    collectionMethod: 'charge_automatically',
    ...overrides,
  };
}

export function record(overrides: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    stripeSubscriptionId: 'sub_1',
    businessId: BIZ,
    stripeCustomerId: 'cus_1',
    planId: 'xangarro',
    interval: 'month',
    status: 'active',
    stripeStatus: 'active',
    trialEnd: null,
    currentPeriodStart: at(-10),
    currentPeriodEnd: at(20),
    cancelAt: null,
    collectionMethod: 'charge_automatically',
    ...overrides,
  };
}

export class FakeRepo implements BillingRepository {
  readonly customers = new Map<string, string>();
  readonly rows = new Map<string, SubscriptionRecord>();
  customerOf(businessId: string) {
    return Promise.resolve(this.customers.get(businessId) ?? null);
  }
  saveCustomer(businessId: string, customerId: string) {
    this.customers.set(businessId, customerId);
    return Promise.resolve();
  }
  businessOfCustomer(customerId: string) {
    const hit = [...this.customers].find(([, c]) => c === customerId);
    return Promise.resolve(hit?.[0] ?? null);
  }
  subscriptionsOf(businessId: string) {
    return Promise.resolve([...this.rows.values()].filter((r) => r.businessId === businessId));
  }
  saveSubscription(r: SubscriptionRecord) {
    this.rows.set(r.stripeSubscriptionId, r);
    return Promise.resolve();
  }
}

export class FakeGateway implements BillingGateway {
  readonly subscriptions = new Map<string, SubscriptionFacts>();
  readonly checkouts: CheckoutRequest[] = [];
  readonly speis: SpeiRequest[] = [];
  readonly cancelled: string[] = [];
  customersCreated = 0;
  createCustomer() {
    this.customersCreated += 1;
    return Promise.resolve(`cus_new${this.customersCreated}`);
  }
  createCheckoutSession(request: CheckoutRequest) {
    this.checkouts.push(request);
    return Promise.resolve('https://checkout.stripe.com/c/pay/cs_test_1');
  }
  createSpeiSubscription(request: SpeiRequest) {
    this.speis.push(request);
    const subscription = facts({
      id: 'sub_spei',
      customerId: request.customerId,
      lookupKey: request.lookupKey,
      collectionMethod: 'send_invoice',
      currentPeriodEnd: at(365),
      currentPeriodStart: at(0),
    });
    this.subscriptions.set(subscription.id, subscription);
    return Promise.resolve({ subscription, hostedInvoiceUrl: 'https://invoice.stripe.com/i/1' });
  }
  cancelSubscription(id: string) {
    this.cancelled.push(id);
    return Promise.resolve();
  }
  createPortalSession(customerId: string) {
    return Promise.resolve(`https://billing.stripe.com/p/session/${customerId}`);
  }
  retrieveSubscription(id: string) {
    const found = this.subscriptions.get(id);
    return found
      ? Promise.resolve(found)
      : Promise.reject(new Error(`No such subscription: ${id}`));
  }
}

export class FakeLedger implements StripeEventLedger {
  readonly events = new Map<string, { processed: boolean; note: string | null }>();
  begin(id: string) {
    const seen = this.events.get(id);
    if (seen === undefined) {
      this.events.set(id, { processed: false, note: null });
      return Promise.resolve('new' as const);
    }
    return Promise.resolve(seen.processed ? ('done' as const) : ('retry' as const));
  }
  finish(id: string, note: string | null) {
    this.events.set(id, { processed: true, note });
    return Promise.resolve();
  }
  fail(id: string, error: string) {
    this.events.set(id, { processed: false, note: error });
    return Promise.resolve();
  }
}

export class RecordingInvoices implements InvoicePaidListener {
  readonly paid: PaidInvoice[] = [];
  onInvoicePaid(invoice: PaidInvoice) {
    this.paid.push(invoice);
    return Promise.resolve();
  }
}
