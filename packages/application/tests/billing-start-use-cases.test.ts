import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  BillingError,
  OpenCustomerPortalUseCase,
  StartSpeiAnnualUseCase,
  StartTrialCheckoutUseCase,
} from '../src/billing/index.js';
import { BIZ, FakeGateway, FakeRepo, at, business, record } from './support/billing-fakes.js';

const urls = {
  successUrl: 'https://app.test/suscripcion?ok=1',
  cancelUrl: 'https://app.test/suscripcion',
};
const code = (c: string) => (e: unknown) => e instanceof BillingError && e.code === c;

let repo: FakeRepo;
let gateway: FakeGateway;
beforeEach(() => {
  repo = new FakeRepo();
  gateway = new FakeGateway();
});

describe('StartTrialCheckoutUseCase', () => {
  const run = (plan: string, interval: string) =>
    new StartTrialCheckoutUseCase(repo, gateway).execute({ business, plan, interval, ...urls });

  it('first subscription: a 14-day trial Checkout on the plan and interval asked for', async () => {
    const url = await run('xangarrote', 'year');
    assert.match(url, /^https:\/\/checkout\.stripe\.com\//);
    assert.deepEqual(gateway.checkouts[0], {
      customerId: 'cus_new1',
      businessId: BIZ,
      lookupKey: 'plan_xangarrote_annual',
      trialDays: 14,
      ...urls,
    });
    assert.equal(repo.customers.get(BIZ), 'cus_new1', 'the customer is remembered');
  });

  it('a business that already had a subscription gets no second trial, and no second customer', async () => {
    repo.customers.set(BIZ, 'cus_1');
    repo.rows.set('sub_1', record({ status: 'lapsed' }));
    await run('xangarro', 'month');
    assert.equal(gateway.checkouts[0]?.trialDays, null);
    assert.equal(gateway.checkouts[0]?.customerId, 'cus_1');
    assert.equal(gateway.customersCreated, 0);
  });

  it('refuses the free plan', async () => {
    await assert.rejects(run('xangarrito', 'month'), code('NOT_A_PAID_PLAN'));
    assert.equal(gateway.checkouts.length, 0);
  });

  it('refuses an unknown interval', async () => {
    await assert.rejects(run('xangarro', 'weekly'), code('INVALID_INTERVAL'));
  });

  it('refuses while a subscription is live', async () => {
    repo.rows.set('sub_1', record({ status: 'past_due' }));
    await assert.rejects(run('xangarro', 'month'), code('ALREADY_SUBSCRIBED'));
  });

  it('refuses to create a customer without the owner email', async () => {
    await assert.rejects(
      new StartTrialCheckoutUseCase(repo, gateway).execute({
        business: { ...business, email: '  ' },
        plan: 'xangarro',
        interval: 'month',
        ...urls,
      }),
      code('MISSING_EMAIL'),
    );
  });
});

describe('StartSpeiAnnualUseCase', () => {
  const run = (plan: string) =>
    new StartSpeiAnnualUseCase(repo, gateway).execute({ business, plan });

  it('creates an annual send_invoice subscription and returns the hosted invoice', async () => {
    const url = await run('xangarro');
    assert.equal(url, 'https://invoice.stripe.com/i/1');
    assert.deepEqual(gateway.speis[0], {
      customerId: 'cus_new1',
      businessId: BIZ,
      lookupKey: 'plan_xangarro_annual',
      daysUntilDue: 7,
    });
    const saved = repo.rows.get('sub_spei');
    assert.equal(saved?.interval, 'year');
    assert.equal(saved?.collectionMethod, 'send_invoice');
  });

  it('replaces a running trial: the trial is cancelled after the SPEI year exists', async () => {
    repo.customers.set(BIZ, 'cus_1');
    repo.rows.set('sub_1', record({ status: 'trialing', trialEnd: at(5) }));
    await run('xangarrote');
    assert.deepEqual(gateway.cancelled, ['sub_1']);
    assert.ok(repo.rows.has('sub_spei'));
  });

  it('refuses the free plan', async () => {
    await assert.rejects(run('xangarrito'), code('NOT_A_PAID_PLAN'));
  });

  it('refuses while a paid subscription is active', async () => {
    repo.rows.set('sub_1', record({ status: 'active' }));
    await assert.rejects(run('xangarro'), code('ALREADY_SUBSCRIBED'));
    assert.equal(gateway.speis.length, 0);
  });

  it('passes a gateway failure through and cancels nothing', async () => {
    repo.rows.set('sub_1', record({ status: 'trialing' }));
    gateway.createSpeiSubscription = () => Promise.reject(new Error('stripe down'));
    await assert.rejects(run('xangarro'), /stripe down/);
    assert.deepEqual(gateway.cancelled, []);
  });
});

describe('OpenCustomerPortalUseCase', () => {
  const run = () =>
    new OpenCustomerPortalUseCase(repo, gateway).execute({
      businessId: BIZ,
      returnUrl: 'https://app.test/suscripcion',
    });

  it('opens the portal for the business customer', async () => {
    repo.customers.set(BIZ, 'cus_1');
    assert.equal(await run(), 'https://billing.stripe.com/p/session/cus_1');
  });

  it('refuses a business that never bought', async () => {
    await assert.rejects(run(), code('NO_BILLING_CUSTOMER'));
  });

  it('refuses another business customer', async () => {
    repo.customers.set('01OTHER', 'cus_9');
    await assert.rejects(run(), code('NO_BILLING_CUSTOMER'));
  });

  it('passes a gateway failure through', async () => {
    repo.customers.set(BIZ, 'cus_1');
    gateway.createPortalSession = () => Promise.reject(new Error('portal not configured'));
    await assert.rejects(run(), /portal not configured/);
  });
});
