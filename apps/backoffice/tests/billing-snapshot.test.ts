import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { SubscriptionRecord } from '@xangarro/application/billing';
import type { BusinessId } from '@xangarro/domain';

import { FREE_BILLING, matchesFilter, snapshotOf, snapshotsFor } from '@/server/billing/snapshot';

/** N-06: the console's billing columns come from B-10's rows, by the portal's own rule. */
const A = '01HZ8XQN9GZJXV8AKQ5X0C7AAA' as BusinessId;
const B = '01HZ8XQN9GZJXV8AKQ5X0C7BBB' as BusinessId;
const row = (over: Partial<SubscriptionRecord> = {}): SubscriptionRecord => ({
  stripeSubscriptionId: 'sub_1',
  businessId: A,
  stripeCustomerId: 'cus_1',
  planId: 'xangarro',
  interval: 'month',
  status: 'active',
  stripeStatus: 'active',
  trialEnd: null,
  currentPeriodStart: '2026-09-01T00:00:00.000Z',
  currentPeriodEnd: '2026-10-01T00:00:00.000Z',
  cancelAt: null,
  collectionMethod: 'charge_automatically',
  ...over,
});

describe('the console’s billing snapshot (N-06)', () => {
  it('shows the subscription that speaks for the business, with its Stripe customer', () => {
    const s = snapshotOf([
      row(),
      row({ stripeSubscriptionId: 'sub_0', status: 'lapsed', planId: 'xangarrote' }),
    ]);
    assert.equal(s.status, 'active');
    assert.equal(s.planId, 'xangarro');
    assert.equal(s.stripeCustomerId, 'cus_1');
  });

  it('a trial shows its end as the next date', () => {
    const s = snapshotOf([row({ status: 'trialing', trialEnd: '2026-09-15T00:00:00.000Z' })]);
    assert.equal(s.currentPeriodEnd, '2026-09-15T00:00:00.000Z');
  });

  it('no rows is the free plan — known, not «Sin datos»', () => {
    assert.deepEqual(snapshotOf([]), FREE_BILLING);
  });

  it('gives every id asked for a snapshot and filters by plan and status', () => {
    const snaps = snapshotsFor([A, B], [row()]);
    assert.equal(snaps.get(B)?.status, 'free');
    assert.equal(matchesFilter(snaps.get(A)!, { status: 'active' }), true);
    assert.equal(matchesFilter(snaps.get(A)!, { plan: 'xangarrote' }), false);
    assert.equal(matchesFilter(snaps.get(B)!, { plan: 'xangarrito', status: 'free' }), true);
  });
});
