import assert from 'node:assert/strict';

import { BillingError } from '@xangarro/application/billing';
import type Stripe from 'stripe';
import { describe, it } from 'vitest';

import { subscriptionFacts, toBillingEvent } from '../../src/server/billing/stripe-mapping';
import { trialCheckoutWith } from '../../src/server/billing/trial-seam';
import { BIZ, fixture } from './support';

interface EventJson {
  type: string;
  data: { object: Record<string, unknown> };
}

const event = (name: string, patch: (e: EventJson) => void = () => undefined) => {
  const e = fixture<EventJson>(name);
  patch(e);
  return e as unknown as Stripe.Event;
};

describe('Stripe → billing shapes (API 2026-08-26.dahlia)', () => {
  it('reads the period from the subscription item and the plan from the lookup key', () => {
    const facts = subscriptionFacts(
      fixture('subscription-trialing') as unknown as Stripe.Subscription,
    );
    assert.deepEqual(facts, {
      id: 'sub_1TestTrial00000000000000',
      customerId: 'cus_TestDonPedro0001',
      businessId: BIZ,
      lookupKey: 'plan_xangarro_monthly',
      stripeStatus: 'trialing',
      trialEnd: '2026-10-01T12:00:00.000Z',
      currentPeriodStart: '2026-09-17T12:00:00.000Z',
      currentPeriodEnd: '2026-10-01T12:00:00.000Z',
      cancelAt: null,
      collectionMethod: 'charge_automatically',
    });
  });

  it('subscription events carry only the id — the use case re-reads Stripe', () => {
    const e = event('event-checkout-completed', (x) => {
      x.type = 'customer.subscription.deleted';
      x.data.object = fixture('subscription-trialing');
    });
    assert.deepEqual(toBillingEvent(e), {
      id: 'evt_TestCheckoutDone0001',
      type: 'customer.subscription.deleted',
      subscriptionId: 'sub_1TestTrial00000000000000',
    });
  });

  it('a payment-mode Checkout is not billing’s', () => {
    const e = event('event-checkout-completed', (x) => void (x.data.object.mode = 'payment'));
    assert.equal(toBillingEvent(e), null);
  });

  it('an invoice with no customer is dropped', () => {
    const e = event('event-invoice-paid', (x) => void (x.data.object.customer = null));
    assert.equal(toBillingEvent(e), null);
  });

  it('a failed invoice keeps its subscription', () => {
    const e = event('event-invoice-paid', (x) => void (x.type = 'invoice.payment_failed'));
    const b = toBillingEvent(e);
    assert.equal(b?.type, 'invoice.payment_failed');
    assert.equal(b && 'subscriptionId' in b && b.subscriptionId, 'sub_1TestTrial00000000000000');
  });
});

describe('N-13 trial seam adapter', () => {
  const business = { id: BIZ, name: 'Taquería', email: 'p@x.mx' };
  const urls = { successUrl: 'https://x/ok', cancelUrl: 'https://x/no' };

  it('maps mensual/anual to month/year and redirects', async () => {
    const seen: string[] = [];
    const seam = trialCheckoutWith(
      { execute: (i) => (seen.push(i.interval), Promise.resolve('https://checkout.stripe.com/x')) },
      business,
      urls,
      () => undefined,
    );
    assert.deepEqual(await seam.startTrialCheckout({ plan: 'xangarro', interval: 'anual' }), {
      status: 'redirect',
      url: 'https://checkout.stripe.com/x',
    });
    assert.deepEqual(seen, ['year']);
  });

  it('a refusal is reported and answered unavailable', async () => {
    const reported: unknown[] = [];
    const seam = trialCheckoutWith(
      { execute: () => Promise.reject(new BillingError('ALREADY_SUBSCRIBED')) },
      business,
      urls,
      (e) => void reported.push(e),
    );
    assert.deepEqual(await seam.startTrialCheckout({ plan: 'xangarro', interval: 'mensual' }), {
      status: 'unavailable',
    });
    assert.equal(reported.length, 1);
  });
});
