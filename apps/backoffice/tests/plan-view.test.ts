import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { PlanOverride } from '@xangarro/domain';

import type { BillingSnapshot } from '@/server/billing/port';
import { limitsOf, planView } from '@/server/tenants/plan-view';

/** The console's plan follows what the next entitlement carries (N-06, Q14). */
const NOW = new Date('2026-09-23T12:00:00.000Z');
const billing = (over: Partial<BillingSnapshot>): BillingSnapshot => ({
  planId: 'xangarro',
  status: 'active',
  interval: 'month',
  currentPeriodEnd: '2026-10-01T00:00:00.000Z',
  stripeCustomerId: 'cus_1',
  ...over,
});
const comp: PlanOverride = {
  id: '01HZ8XQN9GZJXV8AKQ5X0OVR01' as PlanOverride['id'],
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as PlanOverride['businessId'],
  createdBy: '01HZ8XQN9GZJXV8AKQ5X0STAF1' as PlanOverride['createdBy'],
  createdAt: '2026-09-20T00:00:00.000Z',
  kind: 'comp_plan',
  planId: 'xangarrote',
  reason: 'beta tester',
  expiresAt: '2026-10-20T00:00:00.000Z',
};

describe('planView', () => {
  it('an active subscription is its plan', () => {
    const v = planView(billing({}), [], NOW);
    assert.equal(v.effective, 'xangarro');
    assert.equal(limitsOf(v).activeProducts, 1_000);
  });

  it('a lapsed subscription is judged by the free plan, while base keeps Stripe’s plan', () => {
    const v = planView(billing({ status: 'lapsed' }), [], NOW);
    assert.equal(v.base, 'xangarro');
    assert.equal(v.effective, 'xangarrito');
    assert.equal(limitsOf(v).activeProducts, 50);
  });

  it('a comp still lifts a lapsed tenant', () => {
    assert.equal(planView(billing({ status: 'lapsed' }), [comp], NOW).effective, 'xangarrote');
  });

  it('unknown billing stays unknown, not «free» presented as Stripe’s word', () => {
    assert.equal(planView(billing({ planId: null, status: 'unknown' }), [], NOW).effective, null);
  });
});
