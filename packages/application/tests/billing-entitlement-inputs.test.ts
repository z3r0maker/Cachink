import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { PLATFORM_FLAG_DEFAULTS, type PlanOverrideFacts } from '@xangarro/domain';

import { entitlementFromBilling } from '../src/billing/index.js';
import { BIZ, NOW, at, record } from './support/billing-fakes.js';

/**
 * N-09 and N-06: what the console sets reaches the entitlement. Platform
 * flags narrow `features`; a comp lifts the plan until it expires, with no
 * grace; a trial extension moves the trial's end, even after Stripe ended it.
 */
const comp = (planId: 'xangarro' | 'xangarrote', expiresAt: string): PlanOverrideFacts => ({
  id: '01HZ8XQN9GZJXV8AKQ5X0OVR01',
  kind: 'comp_plan',
  planId,
  expiresAt,
  createdAt: at(-1),
});
const extend = (days: number): PlanOverrideFacts => ({
  id: '01HZ8XQN9GZJXV8AKQ5X0OVR02',
  kind: 'extend_trial',
  days,
  expiresAt: at(60),
  createdAt: at(-1),
});
const platform = (off: keyof typeof PLATFORM_FLAG_DEFAULTS) => ({
  ...PLATFORM_FLAG_DEFAULTS,
  [off]: false,
});

describe('entitlementFromBilling with the console’s inputs', () => {
  it('a comp lifts a free business to the comped plan, valid until the comp ends and not a day more', () => {
    const e = entitlementFromBilling(BIZ, [], NOW, {
      overrides: [comp('xangarrote', at(10))],
      platform: PLATFORM_FLAG_DEFAULTS,
    });
    assert.equal(e.plan, 'xangarrote');
    assert.equal(e.validUntil, at(10));
    assert.equal(e.graceUntil, at(10), 'a gift has a date, not a grace period');
  });

  it('an expired comp reverts to the base plan', () => {
    const e = entitlementFromBilling(BIZ, [], NOW, {
      overrides: [comp('xangarrote', at(-0.5))],
      platform: PLATFORM_FLAG_DEFAULTS,
    });
    assert.equal(e.plan, 'xangarrito');
  });

  it('a comp never lowers a paid plan', () => {
    const rows = [record({ planId: 'xangarrote', status: 'active', currentPeriodEnd: at(20) })];
    const e = entitlementFromBilling(BIZ, rows, NOW, {
      overrides: [comp('xangarro', at(10))],
      platform: PLATFORM_FLAG_DEFAULTS,
    });
    assert.equal(e.plan, 'xangarrote');
    assert.equal(e.validUntil, at(20));
  });

  it('a trial extension moves the trial’s end, even after Stripe lapsed it', () => {
    const trial = record({
      status: 'lapsed',
      stripeStatus: 'canceled',
      trialEnd: at(-2),
      currentPeriodEnd: at(-2),
    });
    const e = entitlementFromBilling(BIZ, [trial], NOW, {
      overrides: [extend(14)],
      platform: PLATFORM_FLAG_DEFAULTS,
    });
    assert.equal(e.plan, 'xangarro');
    assert.equal(e.validUntil, at(12));
  });

  it('a trial extension does nothing for a business that never trialed', () => {
    const paid = record({
      status: 'lapsed',
      stripeStatus: 'canceled',
      trialEnd: null,
      currentPeriodEnd: at(-30),
    });
    const e = entitlementFromBilling(BIZ, [paid], NOW, {
      overrides: [extend(14)],
      platform: PLATFORM_FLAG_DEFAULTS,
    });
    assert.equal(e.plan, 'xangarrito');
  });

  it('a platform flag switched off leaves the plan’s features, and an allowlisted one comes back', () => {
    const rows = [record({ planId: 'xangarrote', status: 'active', currentPeriodEnd: at(20) })];
    const on = entitlementFromBilling(BIZ, rows, NOW, {
      overrides: [],
      platform: { ...PLATFORM_FLAG_DEFAULTS, stock: true },
    });
    const off = entitlementFromBilling(BIZ, rows, NOW, {
      overrides: [],
      platform: platform('stock'),
    });
    assert.ok(on.features.includes('stock'));
    assert.equal(off.features.includes('stock'), false);
  });

  it('without inputs, features are the plan’s ∩ the code defaults — nothing staff never released', () => {
    const rows = [record({ planId: 'xangarrote', status: 'active', currentPeriodEnd: at(20) })];
    const e = entitlementFromBilling(BIZ, rows, NOW);
    for (const k of e.features) assert.equal(PLATFORM_FLAG_DEFAULTS[k], true, k);
  });
});
