import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  BillingError,
  CancelSubscriptionUseCase,
  ResumeSubscriptionUseCase,
} from '../src/billing/index.js';
import { BIZ, FakeGateway, FakeRepo, NOW, at, facts, record } from './support/billing-fakes.js';
import { FakeCancellations, FakeConfirmations } from './support/cancel-fakes.js';

const code = (c: string) => (e: unknown) => e instanceof BillingError && e.code === c;

let repo: FakeRepo;
let gateway: FakeGateway;
let ledger: FakeCancellations;
let confirmations: FakeConfirmations;
let reported: unknown[];

function cancel() {
  return new CancelSubscriptionUseCase({
    repo,
    gateway,
    ledger,
    notices: confirmations,
    report: (e) => reported.push(e),
    now: () => NOW,
  }).execute({ businessId: BIZ, channel: 'portal', requestedBy: 'user-1' });
}

beforeEach(() => {
  repo = new FakeRepo();
  gateway = new FakeGateway();
  ledger = new FakeCancellations();
  confirmations = new FakeConfirmations();
  reported = [];
  repo.rows.set('sub_1', record());
  gateway.subscriptions.set('sub_1', facts());
});

describe('CancelSubscriptionUseCase (LFPC 76 Bis)', () => {
  it('cancels at the end of the paid period, saves the row, records the acuse and confirms it', async () => {
    const r = await cancel();
    assert.deepEqual(r, { outcome: 'cancelled', endsAt: at(20), folio: 'CX-000001' });
    assert.deepEqual(gateway.cancelAtPeriodEnd, [{ id: 'sub_1', cancel: true }]);
    assert.equal(gateway.cancelled.length, 0, 'never an immediate cancel');
    assert.equal(repo.rows.get('sub_1')?.cancelAt, at(20), 'the screen sees it before the webhook');
    assert.deepEqual(ledger.acts[0], {
      businessId: BIZ,
      stripeSubscriptionId: 'sub_1',
      channel: 'portal',
      endsAt: at(20),
      requestedBy: 'user-1',
      requestedAt: NOW.toISOString(),
    });
    assert.equal(confirmations.sent[0]?.folio, 'CX-000001');
    assert.equal(confirmations.sent[0]?.planId, 'xangarro');
  });

  it('a subscription already cancelled is answered with its end date, and nothing is recorded twice', async () => {
    repo.rows.set('sub_1', record({ cancelAt: at(20) }));
    assert.deepEqual(await cancel(), { outcome: 'already', endsAt: at(20) });
    assert.equal(gateway.cancelAtPeriodEnd.length, 0);
    assert.equal(ledger.acts.length, 0);
    assert.equal(confirmations.sent.length, 0);
  });

  it('refuses a business with no subscription', async () => {
    repo.rows.clear();
    await assert.rejects(cancel(), code('NO_SUBSCRIPTION'));
  });

  it('refuses a lapsed subscription: there is nothing left to cancel', async () => {
    repo.rows.set('sub_1', record({ status: 'lapsed', stripeStatus: 'canceled' }));
    await assert.rejects(cancel(), code('NO_SUBSCRIPTION'));
    assert.equal(gateway.cancelAtPeriodEnd.length, 0);
  });

  it('a confirmation that cannot be sent is reported and never undoes the cancellation', async () => {
    confirmations.fail = true;
    const r = await cancel();
    assert.equal(r.outcome, 'cancelled');
    assert.equal(ledger.acts.length, 1);
    assert.equal(reported.length, 1);
  });

  it('a Stripe failure changes nothing here: no row, no acuse, no email', async () => {
    gateway.subscriptions.clear();
    await assert.rejects(cancel(), /No such subscription/);
    assert.equal(repo.rows.get('sub_1')?.cancelAt, null);
    assert.equal(ledger.acts.length, 0);
    assert.equal(confirmations.sent.length, 0);
  });
});

describe('ResumeSubscriptionUseCase («Seguir con mi plan»)', () => {
  const resume = () => new ResumeSubscriptionUseCase(repo, gateway).execute({ businessId: BIZ });

  it('takes the cancellation back and saves the row', async () => {
    repo.rows.set('sub_1', record({ cancelAt: at(20) }));
    gateway.subscriptions.set('sub_1', facts({ cancelAt: at(20) }));
    assert.deepEqual(await resume(), { outcome: 'resumed' });
    assert.deepEqual(gateway.cancelAtPeriodEnd, [{ id: 'sub_1', cancel: false }]);
    assert.equal(repo.rows.get('sub_1')?.cancelAt, null);
  });

  it('a subscription that renews already is left alone', async () => {
    assert.deepEqual(await resume(), { outcome: 'already' });
    assert.equal(gateway.cancelAtPeriodEnd.length, 0);
  });

  it('refuses a business with no subscription', async () => {
    repo.rows.clear();
    await assert.rejects(resume(), code('NO_SUBSCRIPTION'));
  });

  it('refuses a subscription that already ended: that is a new purchase', async () => {
    repo.rows.set('sub_1', record({ status: 'lapsed', cancelAt: at(-1) }));
    await assert.rejects(resume(), code('NO_SUBSCRIPTION'));
  });
});
