import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  ApplyStripeEventUseCase,
  noopInvoicePaid,
  type BillingEvent,
  type InvoiceEvent,
} from '../src/billing/index.js';
import {
  BIZ,
  FakeGateway,
  FakeLedger,
  FakeRepo,
  NOW,
  RecordingInvoices,
  at,
  facts,
} from './support/billing-fakes.js';

let repo: FakeRepo;
let gateway: FakeGateway;
let ledger: FakeLedger;
let invoices: RecordingInvoices;
let useCase: ApplyStripeEventUseCase;

beforeEach(() => {
  repo = new FakeRepo();
  gateway = new FakeGateway();
  ledger = new FakeLedger();
  invoices = new RecordingInvoices();
  useCase = new ApplyStripeEventUseCase({ repo, gateway, ledger, invoices, now: () => NOW });
});

const checkout: BillingEvent = {
  id: 'evt_checkout',
  type: 'checkout.session.completed',
  businessId: BIZ,
  customerId: 'cus_1',
  subscriptionId: 'sub_1',
};

function invoiceEvent(type: InvoiceEvent['type'], id = 'evt_inv'): InvoiceEvent {
  return {
    id,
    type,
    customerId: 'cus_1',
    subscriptionId: 'sub_1',
    invoice: {
      stripeInvoiceId: 'in_1',
      stripeSubscriptionId: 'sub_1',
      subtotalCentavos: 19_900,
      taxCentavos: 3_184,
      totalCentavos: 23_084,
      currency: 'mxn',
      paidAt: at(0),
      collectionMethod: 'charge_automatically',
    },
  };
}

describe('ApplyStripeEventUseCase', () => {
  it('checkout.session.completed: remembers the customer, stores the trial, entitles the plan', async () => {
    gateway.subscriptions.set(
      'sub_1',
      facts({
        stripeStatus: 'trialing',
        trialEnd: at(14),
        currentPeriodEnd: at(14),
        businessId: null,
      }),
    );
    const result = await useCase.execute(checkout);
    assert.equal(result.outcome, 'applied');
    assert.equal(repo.customers.get(BIZ), 'cus_1');
    assert.equal(repo.rows.get('sub_1')?.status, 'trialing');
    assert.equal(result.outcome === 'applied' && result.entitlement.plan, 'xangarro');
    assert.deepEqual(ledger.events.get('evt_checkout'), { processed: true, note: null });
  });

  it('customer.subscription.updated: re-reads Stripe and writes the row whole', async () => {
    gateway.subscriptions.set('sub_1', facts({ lookupKey: 'plan_xangarrote_annual' }));
    await useCase.execute({
      id: 'evt_u',
      type: 'customer.subscription.updated',
      subscriptionId: 'sub_1',
    });
    assert.equal(repo.rows.get('sub_1')?.planId, 'xangarrote');
    assert.equal(repo.rows.get('sub_1')?.interval, 'year');
  });

  it('customer.subscription.deleted lapses to the free plan', async () => {
    gateway.subscriptions.set('sub_1', facts({ stripeStatus: 'canceled' }));
    const r = await useCase.execute({
      id: 'evt_d',
      type: 'customer.subscription.deleted',
      subscriptionId: 'sub_1',
    });
    assert.equal(repo.rows.get('sub_1')?.status, 'lapsed');
    assert.equal(r.outcome === 'applied' && r.entitlement.plan, 'xangarrito');
  });

  it('invoice.paid: active, and the CFDI port hears about the payment once', async () => {
    gateway.subscriptions.set('sub_1', facts({ stripeStatus: 'past_due' }));
    const r = await useCase.execute(invoiceEvent('invoice.paid'));
    assert.equal(r.outcome === 'applied' && r.status, 'active');
    assert.equal(invoices.paid.length, 1);
    assert.equal(invoices.paid[0]?.businessId, BIZ);
    assert.equal(invoices.paid[0]?.totalCentavos, 23_084);
  });

  it('invoice.payment_failed inside grace: past_due, and the plan holds', async () => {
    gateway.subscriptions.set(
      'sub_1',
      facts({ currentPeriodStart: at(-2), currentPeriodEnd: at(28) }),
    );
    const r = await useCase.execute(invoiceEvent('invoice.payment_failed'));
    assert.equal(repo.rows.get('sub_1')?.status, 'past_due');
    assert.equal(r.outcome === 'applied' && r.entitlement.plan, 'xangarro');
    assert.equal(invoices.paid.length, 0);
  });

  it('a duplicate event changes nothing', async () => {
    gateway.subscriptions.set('sub_1', facts());
    await useCase.execute(invoiceEvent('invoice.paid'));
    repo.rows.clear();
    const again = await useCase.execute(invoiceEvent('invoice.paid'));
    assert.deepEqual(again, { outcome: 'duplicate' });
    assert.equal(repo.rows.size, 0);
    assert.equal(invoices.paid.length, 1, 'one payment, one CFDI item');
  });

  it('an unknown subscription is recorded as ignored, not retried', async () => {
    gateway.subscriptions.set(
      'sub_x',
      facts({ id: 'sub_x', customerId: 'cus_x', businessId: null }),
    );
    const r = await useCase.execute({
      id: 'evt_x',
      type: 'customer.subscription.created',
      subscriptionId: 'sub_x',
    });
    assert.deepEqual(r, { outcome: 'ignored', reason: 'UNKNOWN_BUSINESS' });
    assert.deepEqual(ledger.events.get('evt_x'), { processed: true, note: 'UNKNOWN_BUSINESS' });
  });

  it('a price we did not seed grants nothing', async () => {
    gateway.subscriptions.set('sub_1', facts({ lookupKey: 'hand_made_price' }));
    const r = await useCase.execute(checkout);
    assert.deepEqual(r, { outcome: 'ignored', reason: 'UNKNOWN_PRICE' });
    assert.equal(repo.rows.size, 0);
  });

  it('a failure is recorded and rethrown, and the retry runs it again', async () => {
    await assert.rejects(useCase.execute(checkout), /No such subscription/);
    assert.deepEqual(ledger.events.get('evt_checkout'), {
      processed: false,
      note: 'No such subscription: sub_1',
    });
    gateway.subscriptions.set('sub_1', facts());
    assert.equal((await useCase.execute(checkout)).outcome, 'applied');
  });

  it('a paid invoice with no subscription still reaches the CFDI port', async () => {
    repo.customers.set(BIZ, 'cus_1');
    const r = await useCase.execute({ ...invoiceEvent('invoice.paid'), subscriptionId: null });
    assert.equal(r.outcome === 'applied' && r.status, null);
    assert.equal(invoices.paid.length, 1);
  });

  it('a paid invoice from a stranger is ignored', async () => {
    const r = await useCase.execute({ ...invoiceEvent('invoice.paid'), subscriptionId: null });
    assert.deepEqual(r, { outcome: 'ignored', reason: 'UNKNOWN_BUSINESS' });
  });

  it('checkout without a subscription is ignored; the customer is still remembered', async () => {
    const r = await useCase.execute({ ...checkout, subscriptionId: null });
    assert.deepEqual(r, { outcome: 'ignored', reason: 'NO_SUBSCRIPTION' });
    assert.equal(repo.customers.get(BIZ), 'cus_1');
  });

  it('keeps the customer already on file', async () => {
    repo.customers.set(BIZ, 'cus_1');
    gateway.subscriptions.set('sub_1', facts());
    await useCase.execute({ ...checkout, customerId: 'cus_other' });
    assert.equal(repo.customers.get(BIZ), 'cus_1');
  });

  it('the default CFDI port is a no-op', async () => {
    const out = await noopInvoicePaid.onInvoicePaid({
      ...invoiceEvent('invoice.paid').invoice,
      businessId: BIZ,
    });
    assert.equal(out, undefined);
  });
});
