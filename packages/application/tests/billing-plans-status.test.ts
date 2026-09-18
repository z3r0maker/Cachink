import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  LOOKUP_KEYS,
  billingStatusSnapshot,
  currentSubscription,
  entitlementFromBilling,
  lookupKey,
  nextStatus,
  parseLookupKey,
  recordFrom,
  toSnapshot,
  totalCentavos,
} from '../src/billing/index.js';
import { BIZ, NOW, at, facts, record } from './support/billing-fakes.js';

describe('billing plans (N-01, ADR-067)', () => {
  it('totals are the list price plus 16 % IVA, in centavos', () => {
    assert.equal(totalCentavos('xangarro', 'month'), 23_084);
    assert.equal(totalCentavos('xangarrote', 'month'), 46_284);
    assert.equal(totalCentavos('xangarro', 'year'), 230_840);
    assert.equal(totalCentavos('xangarrote', 'year'), 462_840);
  });

  it('lookup keys carry the plan_ prefix and round-trip', () => {
    assert.deepEqual(LOOKUP_KEYS, [
      'plan_xangarro_monthly',
      'plan_xangarro_annual',
      'plan_xangarrote_monthly',
      'plan_xangarrote_annual',
    ]);
    assert.deepEqual(parseLookupKey(lookupKey('xangarrote', 'year')), {
      planId: 'xangarrote',
      interval: 'year',
    });
  });

  it('a price we did not seed is no plan', () => {
    assert.equal(parseLookupKey('xangarro_monthly'), null);
    assert.equal(parseLookupKey(null), null);
    assert.equal(recordFrom(facts({ lookupKey: 'legacy' }), BIZ, 'sync'), null);
  });
});

describe('nextStatus — the state machine', () => {
  it('maps Stripe statuses', () => {
    assert.equal(nextStatus('trialing', 'sync'), 'trialing');
    assert.equal(nextStatus('active', 'sync'), 'active');
    assert.equal(nextStatus('past_due', 'sync'), 'past_due');
    for (const s of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
      assert.equal(nextStatus(s, 'sync'), 'lapsed', s);
    }
  });

  it('a failed payment makes an active subscription past_due; a paid one makes it active', () => {
    assert.equal(nextStatus('active', 'failed'), 'past_due');
    assert.equal(nextStatus('past_due', 'paid'), 'active');
    assert.equal(nextStatus('trialing', 'failed'), 'trialing');
  });

  it('deletion lapses whatever Stripe last said', () => {
    assert.equal(nextStatus('active', 'deleted'), 'lapsed');
  });
});

describe('current subscription and its entitlement', () => {
  it('no rows is the free plan', () => {
    assert.equal(currentSubscription([]), null);
    assert.equal(toSnapshot(null), null);
    assert.equal(entitlementFromBilling(BIZ, [], NOW).plan, 'xangarrito');
    assert.equal(billingStatusSnapshot([]), null);
  });

  it('a paid SPEI year outranks the trial it replaces', () => {
    const trial = record({ stripeSubscriptionId: 'sub_t', status: 'trialing', trialEnd: at(3) });
    const spei = record({ stripeSubscriptionId: 'sub_s', planId: 'xangarrote', interval: 'year' });
    assert.equal(currentSubscription([trial, spei])?.stripeSubscriptionId, 'sub_s');
  });

  it('a trial is entitled until its end, then 7 days of grace', () => {
    const rows = [record({ status: 'trialing', trialEnd: at(4), currentPeriodEnd: at(4) })];
    const e = entitlementFromBilling(BIZ, rows, NOW);
    assert.equal(e.plan, 'xangarro');
    assert.equal(e.validUntil, at(4));
    assert.equal(e.graceUntil, at(11));
    assert.equal(billingStatusSnapshot(rows)?.currentPeriodEnd, at(4));
  });

  it('a failed payment inside grace keeps the plan', () => {
    const rows = [
      record({ status: 'past_due', currentPeriodStart: at(-3), currentPeriodEnd: at(27) }),
    ];
    const e = entitlementFromBilling(BIZ, rows, NOW);
    assert.equal(e.plan, 'xangarro');
    assert.equal(e.graceUntil, at(4), 'grace counts from when the unpaid period began');
  });

  it('past grace, an unpaid subscription is the free plan — not the whole new period', () => {
    const rows = [
      record({ status: 'past_due', currentPeriodStart: at(-8), currentPeriodEnd: at(22) }),
    ];
    assert.equal(entitlementFromBilling(BIZ, rows, NOW).plan, 'xangarrito');
  });

  it('lapsed is the free plan', () => {
    assert.equal(
      entitlementFromBilling(BIZ, [record({ status: 'lapsed' })], NOW).plan,
      'xangarrito',
    );
  });

  it('the admin snapshot carries plan, status, interval, next charge and customer', () => {
    assert.deepEqual(billingStatusSnapshot([record()]), {
      planId: 'xangarro',
      status: 'active',
      interval: 'month',
      currentPeriodEnd: at(20),
      stripeCustomerId: 'cus_1',
    });
  });
});
