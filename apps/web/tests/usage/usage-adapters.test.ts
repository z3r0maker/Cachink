import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { PLAN_LIMITS } from '@xangarro/domain';
import { usageLimitsOf } from '@xangarro/domain/usage';

/**
 * The usage recompute's Postgres ports (N-02 / N-03). The limits are the part
 * with rules — each business metered by the plan its billing rows entitle it
 * to, a lapsed plan as the free one — and the rest must hand each call to the
 * right query on the right connection.
 */

const usageCounts = vi.fn();
const saveUsageCounters = vi.fn();
const usageCountersOf = vi.fn();
const beginUsageNotice = vi.fn();
const finishUsageNotice = vi.fn();
const subscriptionsOfBusinesses = vi.fn();

vi.mock('@xangarro/data-pg', () => ({
  usageCounts,
  saveUsageCounters,
  usageCountersOf,
  beginUsageNotice,
  finishUsageNotice,
  subscriptionsOfBusinesses,
}));

const {
  limitsFromSubscriptions,
  pgUsageCounters,
  pgUsageCounts,
  pgUsageLimits,
  pgUsageNoticeLedger,
} = await import('../../src/server/usage/adapters');

const NOW = new Date('2026-09-24T12:00:00.000Z');
const METERING = { name: 'metering' } as never;
const BILLING = { name: 'billing' } as never;

function subscription(businessId: string, over: Record<string, unknown> = {}) {
  return {
    stripeSubscriptionId: `sub_${businessId}`,
    businessId,
    stripeCustomerId: `cus_${businessId}`,
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
  } as never;
}

const FREE = usageLimitsOf(PLAN_LIMITS.xangarrito);
const PAID = usageLimitsOf(PLAN_LIMITS.xangarro);

beforeEach(() => vi.clearAllMocks());

describe('limitsFromSubscriptions', () => {
  it('a paying business is metered by its plan', () => {
    const limits = limitsFromSubscriptions(['biz-a'], [subscription('biz-a')], NOW);
    assert.deepEqual(limits.get('biz-a'), PAID);
  });

  it('no billing rows is the free plan', () => {
    assert.deepEqual(limitsFromSubscriptions(['biz-a'], [], NOW).get('biz-a'), FREE);
  });

  it('a plan that ended months ago is metered as the free one', () => {
    // `lapsed` is ours; `canceled` is Stripe's word and lives in stripeStatus.
    const lapsed = subscription('biz-a', {
      status: 'lapsed',
      stripeStatus: 'canceled',
      currentPeriodEnd: '2026-05-01T00:00:00.000Z',
    });
    assert.deepEqual(limitsFromSubscriptions(['biz-a'], [lapsed], NOW).get('biz-a'), FREE);
  });

  it('each business reads only its own rows', () => {
    const limits = limitsFromSubscriptions(['biz-a', 'biz-b'], [subscription('biz-b')], NOW);
    assert.deepEqual(limits.get('biz-a'), FREE);
    assert.deepEqual(limits.get('biz-b'), PAID);
  });
});

describe('pgUsageLimits', () => {
  it('reads the billing rows 500 businesses at a time, never one giant IN list', async () => {
    subscriptionsOfBusinesses.mockResolvedValue([]);
    const ids = Array.from({ length: 1_001 }, (_, i) => `biz-${i}`);
    const limits = await pgUsageLimits(BILLING, () => NOW).limitsOf(ids);
    assert.deepEqual(
      subscriptionsOfBusinesses.mock.calls.map(([db, batch]) => [db, (batch as string[]).length]),
      [
        [BILLING, 500],
        [BILLING, 500],
        [BILLING, 1],
      ],
    );
    assert.equal(limits.size, 1_001);
  });

  it('no businesses asks nothing', async () => {
    const limits = await pgUsageLimits(BILLING, () => NOW).limitsOf([]);
    assert.equal(subscriptionsOfBusinesses.mock.calls.length, 0);
    assert.equal(limits.size, 0);
  });
});

describe('the metering ports hand each call to its query', () => {
  it('counts: one period for every business, or for the ones named', async () => {
    const first = new Date('2026-09-01T00:00:00.000Z');
    const last = new Date('2026-09-30T23:59:59.000Z');
    await pgUsageCounts(METERING).count(first, last);
    await pgUsageCounts(METERING).count(first, last, ['biz-a']);
    assert.deepEqual(usageCounts.mock.calls, [
      [METERING, null, first, last],
      [METERING, ['biz-a'], first, last],
    ]);
  });

  it('counters: save and history', async () => {
    const counters = pgUsageCounters(METERING);
    await counters.save([], NOW);
    await counters.history(['2026-09']);
    assert.deepEqual(saveUsageCounters.mock.calls, [[METERING, [], NOW]]);
    assert.deepEqual(usageCountersOf.mock.calls, [[METERING, ['2026-09']]]);
  });

  it('the notice ledger begins and finishes by key and recipient', async () => {
    const ledger = pgUsageNoticeLedger(METERING);
    await ledger.begin('biz-a:2026-09:80', 'pedro@taqueria.mx', 'biz-a');
    await ledger.finish('biz-a:2026-09:80', 'pedro@taqueria.mx');
    assert.deepEqual(beginUsageNotice.mock.calls, [
      [METERING, 'biz-a:2026-09:80', 'pedro@taqueria.mx', 'biz-a'],
    ]);
    assert.deepEqual(finishUsageNotice.mock.calls, [
      [METERING, 'biz-a:2026-09:80', 'pedro@taqueria.mx'],
    ]);
  });
});
