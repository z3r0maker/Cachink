import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ApplyStripeEventUseCase, type PaymentFailedNotice } from '../src/billing/index.js';
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
import { invoiceEvent } from './support/billing-harness.js';

/**
 * B-10 step 3 / B-14: the owner is told when a payment fails — once per
 * failed period, only while there is a grace deadline to state.
 */
function withListener() {
  const repo = new FakeRepo();
  const gateway = new FakeGateway();
  const notices: PaymentFailedNotice[] = [];
  const useCase = new ApplyStripeEventUseCase({
    repo,
    gateway,
    ledger: new FakeLedger(),
    invoices: new RecordingInvoices(),
    paymentFailures: { onPaymentFailed: (n) => Promise.resolve(void notices.push(n)) },
    entitlements: { onEntitlementChanged: () => Promise.resolve() },
    now: () => NOW,
  });
  return { repo, gateway, notices, useCase };
}

describe('ApplyStripeEventUseCase — the payment-failed port', () => {
  let h: ReturnType<typeof withListener>;
  beforeEach(() => {
    h = withListener();
  });

  it('a failed payment inside grace tells the port the plan, the period start and the deadline', async () => {
    h.gateway.subscriptions.set(
      'sub_1',
      facts({ currentPeriodStart: at(-2), currentPeriodEnd: at(28) }),
    );
    await h.useCase.execute(invoiceEvent('invoice.payment_failed'));
    assert.equal(h.notices.length, 1);
    const [n] = h.notices;
    assert.equal(n?.businessId, BIZ);
    assert.equal(n?.planId, 'xangarro');
    assert.equal(n?.periodStart, at(-2));
    assert.equal(
      n?.entitlement.graceUntil,
      at(5),
      '7 days from the period start, not the period end',
    );
    assert.equal(n?.entitlement.plan, 'xangarro', 'the plan holds during grace');
  });

  it('a paid invoice tells the port nothing', async () => {
    h.gateway.subscriptions.set('sub_1', facts());
    await h.useCase.execute(invoiceEvent('invoice.paid'));
    assert.deepEqual(h.notices, []);
  });

  it('a subscription Stripe already ended has no deadline left: nothing is sent', async () => {
    h.gateway.subscriptions.set('sub_1', facts({ stripeStatus: 'canceled' }));
    const r = await h.useCase.execute(invoiceEvent('invoice.payment_failed'));
    assert.equal(r.outcome === 'applied' && r.status, 'lapsed');
    assert.deepEqual(h.notices, []);
  });

  it('a redelivered failed event is a duplicate: one notice, not two', async () => {
    h.gateway.subscriptions.set('sub_1', facts({ currentPeriodStart: at(-2) }));
    await h.useCase.execute(invoiceEvent('invoice.payment_failed', 'evt_f1'));
    await h.useCase.execute(invoiceEvent('invoice.payment_failed', 'evt_f1'));
    assert.equal(h.notices.length, 1);
  });

  it('without the port, a failed payment is still applied — the port is optional', async () => {
    const useCase = new ApplyStripeEventUseCase({
      repo: h.repo,
      gateway: h.gateway,
      ledger: new FakeLedger(),
      invoices: new RecordingInvoices(),
      entitlements: { onEntitlementChanged: () => Promise.resolve() },
      now: () => NOW,
    });
    h.gateway.subscriptions.set('sub_1', facts({ currentPeriodStart: at(-2) }));
    const r = await useCase.execute(invoiceEvent('invoice.payment_failed'));
    assert.equal(r.outcome === 'applied' && r.status, 'past_due');
  });
});
