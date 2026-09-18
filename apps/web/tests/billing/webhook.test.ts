import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import { handleStripeWebhook } from '../../src/server/billing/webhook';
import { BIZ, TEST_WEBHOOK_SECRET, chain, fixture, offlineStripe, signed } from './support';

/**
 * `POST /api/stripe/webhook` end to end, without Stripe or a database: the
 * signature is made with Stripe's documented test helper
 * (`webhooks.generateTestHeaderString`) and verified by the same SDK call the
 * route uses; the events are Stripe-shaped fixtures; the use case is real.
 */
const trialing = fixture('subscription-trialing');
const subs = { sub_1TestTrial00000000000000: trialing };

function post(body: string, signature: string | null): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature !== null) headers.set('stripe-signature', signature);
  return new Request('http://localhost/api/stripe/webhook', { method: 'POST', body, headers });
}

function deps(apply: ReturnType<typeof chain>['apply']) {
  return { stripe: offlineStripe, secret: TEST_WEBHOOK_SECRET, apply };
}

describe('Stripe webhook', () => {
  it('checkout.session.completed → the trial is stored and the tenant is entitled', async () => {
    const c = chain(subs);
    const body = JSON.stringify(fixture('event-checkout-completed'));
    const res = await handleStripeWebhook(post(body, signed(body)), deps(c.apply));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { received: true, outcome: 'applied' });
    const row = c.memory.rows.get('sub_1TestTrial00000000000000');
    assert.equal(row?.status, 'trialing');
    assert.equal(row?.planId, 'xangarro');
    assert.equal(row?.trialEnd, '2026-10-01T12:00:00.000Z');
    assert.equal(c.memory.customers.get(BIZ), 'cus_TestDonPedro0001');
  });

  it('invoice.paid → the CFDI port gets the payment in centavos, with IVA', async () => {
    const c = chain({ sub_1TestTrial00000000000000: { ...trialing, status: 'active' } });
    const body = JSON.stringify(fixture('event-invoice-paid'));
    const res = await handleStripeWebhook(post(body, signed(body)), deps(c.apply));
    assert.equal(res.status, 200);
    assert.deepEqual(c.paid[0], {
      businessId: BIZ,
      stripeInvoiceId: 'in_TestFirstMonth0001',
      stripeSubscriptionId: 'sub_1TestTrial00000000000000',
      subtotalCentavos: 19_900,
      taxCentavos: 3_184,
      totalCentavos: 23_084,
      currency: 'mxn',
      paidAt: '2026-10-01T12:01:30.000Z',
      collectionMethod: 'charge_automatically',
    });
  });

  it('the same event twice is applied once', async () => {
    const c = chain(subs);
    const body = JSON.stringify(fixture('event-invoice-paid'));
    await handleStripeWebhook(post(body, signed(body)), deps(c.apply));
    const again = await handleStripeWebhook(post(body, signed(body)), deps(c.apply));
    assert.deepEqual(await again.json(), { received: true, outcome: 'duplicate' });
    assert.equal(c.paid.length, 1);
  });

  it('a forged or altered body is refused before anything runs', async () => {
    const apply = vi.fn();
    const body = JSON.stringify(fixture('event-invoice-paid'));
    const tampered = body.replace('23084', '1');
    const res = await handleStripeWebhook(post(tampered, signed(body)), deps(apply));
    assert.equal(res.status, 400);
    assert.equal(apply.mock.calls.length, 0);
  });

  it('a request with no signature is refused', async () => {
    const apply = vi.fn();
    const res = await handleStripeWebhook(post('{}', null), deps(apply));
    assert.equal(res.status, 400);
    assert.equal(apply.mock.calls.length, 0);
  });

  it('a type billing does not handle is acknowledged and dropped', async () => {
    const apply = vi.fn();
    const body = JSON.stringify({
      ...fixture('event-checkout-completed'),
      type: 'customer.created',
    });
    const res = await handleStripeWebhook(post(body, signed(body)), deps(apply));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { received: true, handled: false });
    assert.equal(apply.mock.calls.length, 0);
  });

  it('a processing failure is recorded, reported, and answered 500 so Stripe retries', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const c = chain({});
    const body = JSON.stringify(fixture('event-checkout-completed'));
    const res = await handleStripeWebhook(post(body, signed(body)), deps(c.apply));
    assert.equal(res.status, 500);
    assert.equal(c.memory.events.get('evt_TestCheckoutDone0001')?.done, false);
    assert.match(String(errors.mock.calls[0]?.[0]), /stripe\/webhook:checkout\.session\.completed/);
    errors.mockRestore();
  });
});
