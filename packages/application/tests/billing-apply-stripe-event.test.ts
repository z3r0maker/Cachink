import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { BIZ, at, facts } from './support/billing-fakes.js';
import { checkout, harness, invoiceEvent } from './support/billing-harness.js';

let h: ReturnType<typeof harness>;
beforeEach(() => {
  h = harness();
});

describe('ApplyStripeEventUseCase — the state machine', () => {
  it('checkout.session.completed: remembers the customer, stores the trial, entitles the plan', async () => {
    h.gateway.subscriptions.set(
      'sub_1',
      facts({
        stripeStatus: 'trialing',
        trialEnd: at(14),
        currentPeriodEnd: at(14),
        businessId: null,
      }),
    );
    const result = await h.useCase.execute(checkout);
    assert.equal(result.outcome, 'applied');
    assert.equal(h.repo.customers.get(BIZ), 'cus_1');
    assert.equal(h.repo.rows.get('sub_1')?.status, 'trialing');
    assert.equal(result.outcome === 'applied' && result.entitlement.plan, 'xangarro');
    assert.deepEqual(h.ledger.events.get('evt_checkout'), { processed: true, note: null });
    assert.deepEqual(h.heard, [{ businessId: BIZ, plan: 'xangarro' }], 'N-13 hears the upgrade');
  });

  it('customer.subscription.updated: re-reads Stripe and writes the row whole', async () => {
    h.gateway.subscriptions.set('sub_1', facts({ lookupKey: 'plan_xangarrote_annual' }));
    await h.useCase.execute({
      id: 'evt_u',
      type: 'customer.subscription.updated',
      subscriptionId: 'sub_1',
    });
    assert.equal(h.repo.rows.get('sub_1')?.planId, 'xangarrote');
    assert.equal(h.repo.rows.get('sub_1')?.interval, 'year');
  });

  it('customer.subscription.deleted lapses to the free plan', async () => {
    h.gateway.subscriptions.set('sub_1', facts({ stripeStatus: 'canceled' }));
    const r = await h.useCase.execute({
      id: 'evt_d',
      type: 'customer.subscription.deleted',
      subscriptionId: 'sub_1',
    });
    assert.equal(h.repo.rows.get('sub_1')?.status, 'lapsed');
    assert.equal(r.outcome === 'applied' && r.entitlement.plan, 'xangarrito');
  });

  it('invoice.paid: active, and the CFDI port hears about the payment', async () => {
    h.gateway.subscriptions.set('sub_1', facts({ stripeStatus: 'past_due' }));
    const r = await h.useCase.execute(invoiceEvent('invoice.paid'));
    assert.equal(r.outcome === 'applied' && r.status, 'active');
    assert.equal(h.invoices.paid.length, 1);
    assert.equal(h.invoices.paid[0]?.businessId, BIZ);
    assert.equal(h.invoices.paid[0]?.totalCentavos, 23_084);
  });

  it('invoice.payment_failed inside grace: past_due, and the plan holds', async () => {
    h.gateway.subscriptions.set(
      'sub_1',
      facts({ currentPeriodStart: at(-2), currentPeriodEnd: at(28) }),
    );
    const r = await h.useCase.execute(invoiceEvent('invoice.payment_failed'));
    assert.equal(h.repo.rows.get('sub_1')?.status, 'past_due');
    assert.equal(r.outcome === 'applied' && r.entitlement.plan, 'xangarro');
    assert.equal(h.invoices.paid.length, 0);
  });

  it('a duplicate event changes nothing', async () => {
    h.gateway.subscriptions.set('sub_1', facts());
    await h.useCase.execute(invoiceEvent('invoice.paid'));
    h.repo.rows.clear();
    const again = await h.useCase.execute(invoiceEvent('invoice.paid'));
    assert.deepEqual(again, { outcome: 'duplicate' });
    assert.equal(h.repo.rows.size, 0);
    assert.equal(h.invoices.paid.length, 1, 'one payment, one CFDI item');
  });

  it('an unknown subscription is recorded as ignored, not retried', async () => {
    h.gateway.subscriptions.set(
      'sub_x',
      facts({ id: 'sub_x', customerId: 'cus_x', businessId: null }),
    );
    const r = await h.useCase.execute({
      id: 'evt_x',
      type: 'customer.subscription.created',
      subscriptionId: 'sub_x',
    });
    assert.deepEqual(r, { outcome: 'ignored', reason: 'UNKNOWN_BUSINESS' });
    assert.deepEqual(h.ledger.events.get('evt_x'), { processed: true, note: 'UNKNOWN_BUSINESS' });
  });

  it('a price we did not seed grants nothing, and nobody hears of it', async () => {
    h.gateway.subscriptions.set('sub_1', facts({ lookupKey: 'hand_made_price' }));
    const r = await h.useCase.execute(checkout);
    assert.deepEqual(r, { outcome: 'ignored', reason: 'UNKNOWN_PRICE' });
    assert.equal(h.repo.rows.size, 0);
    assert.deepEqual(h.heard, []);
  });

  it('a failure is recorded and rethrown, and the retry runs it again', async () => {
    await assert.rejects(h.useCase.execute(checkout), /No such subscription/);
    assert.deepEqual(h.ledger.events.get('evt_checkout'), {
      processed: false,
      note: 'No such subscription: sub_1',
    });
    h.gateway.subscriptions.set('sub_1', facts());
    assert.equal((await h.useCase.execute(checkout)).outcome, 'applied');
  });
});
