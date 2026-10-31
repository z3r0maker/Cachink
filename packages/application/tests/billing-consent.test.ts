import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  ApplyStripeEventUseCase,
  type CheckoutCompleted,
  type TermsAcceptance,
} from '../src/billing/index.js';
import {
  BIZ,
  FakeGateway,
  FakeLedger,
  FakeRepo,
  NOW,
  RecordingInvoices,
  facts,
} from './support/billing-fakes.js';

/** The Checkout consent copied from the webhook (LFPC 76 Bis II). */
function setup() {
  const gateway = new FakeGateway();
  gateway.subscriptions.set('sub_1', facts());
  const recorded: TermsAcceptance[] = [];
  const useCase = new ApplyStripeEventUseCase({
    repo: new FakeRepo(),
    gateway,
    ledger: new FakeLedger(),
    invoices: new RecordingInvoices(),
    entitlements: { onEntitlementChanged: () => Promise.resolve() },
    consents: {
      recordTerms: (a) => {
        recorded.push(a);
        return Promise.resolve();
      },
    },
    now: () => NOW,
  });
  return { useCase, recorded };
}

const event = (over: Partial<CheckoutCompleted> = {}): CheckoutCompleted => ({
  id: 'evt_checkout',
  type: 'checkout.session.completed',
  businessId: BIZ,
  customerId: 'cus_1',
  subscriptionId: 'sub_1',
  checkoutSessionId: 'cs_test_1',
  termsAcceptedAt: '2026-09-17T12:00:00.000Z',
  ...over,
});

describe('Checkout consent', () => {
  it('records the accepted Términos with the session, business and subscription', async () => {
    const { useCase, recorded } = setup();
    await useCase.execute(event());
    assert.deepEqual(recorded, [
      {
        checkoutSessionId: 'cs_test_1',
        businessId: BIZ,
        stripeSubscriptionId: 'sub_1',
        acceptedAt: '2026-09-17T12:00:00.000Z',
      },
    ]);
  });

  it('records nothing when Checkout did not ask (an older session)', async () => {
    const { useCase, recorded } = setup();
    await useCase.execute(event({ termsAcceptedAt: null }));
    assert.equal(recorded.length, 0);
  });

  it('records nothing for a session tied to no business', async () => {
    const { useCase, recorded } = setup();
    await useCase.execute(event({ businessId: null }));
    assert.equal(recorded.length, 0);
  });

  it('a redelivered event records nothing twice', async () => {
    const { useCase, recorded } = setup();
    await useCase.execute(event());
    assert.deepEqual(await useCase.execute(event()), { outcome: 'duplicate' });
    assert.equal(recorded.length, 1);
  });
});
