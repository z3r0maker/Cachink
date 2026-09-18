import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MissingPeriodEndError, PLAN_LIMITS, UnknownPlanError } from '@xangarro/domain';
import { computeEntitlement } from '../src/compute-entitlement/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const NOW = new Date('2026-09-17T12:00:00.000Z');
const DAY = 86_400_000;
const at = (days: number) => new Date(NOW.getTime() + days * DAY).toISOString();

describe('computeEntitlement', () => {
  it('an active subscription gets its plan, valid to the period end, grace 7 days on', () => {
    const e = computeEntitlement(
      BIZ,
      { planId: 'xangarro', status: 'active', currentPeriodEnd: at(20) },
      NOW,
    );
    assert.equal(e.plan, 'xangarro');
    assert.equal(e.businessId, BIZ);
    assert.equal(e.limits.operators, PLAN_LIMITS.xangarro.operators);
    assert.equal(e.limits.devices, PLAN_LIMITS.xangarro.devices);
    assert.deepEqual(e.capabilities, { ...PLAN_LIMITS.xangarro.capabilities });
    assert.equal(e.validUntil, at(20));
    assert.equal(e.graceUntil, at(27));
    assert.equal(e.issuedAt, NOW.toISOString());
    assert.equal(e.serverTime, NOW.toISOString());
  });

  it('trialing is treated as active', () => {
    const e = computeEntitlement(
      BIZ,
      { planId: 'xangarrote', status: 'trialing', currentPeriodEnd: at(5) },
      NOW,
    );
    assert.equal(e.plan, 'xangarrote');
    assert.equal(e.validUntil, at(5));
  });

  it('past_due inside grace keeps the paid plan, with the grace window already running', () => {
    const e = computeEntitlement(
      BIZ,
      { planId: 'xangarro', status: 'past_due', currentPeriodEnd: at(-3) },
      NOW,
    );
    assert.equal(e.plan, 'xangarro');
    assert.equal(e.validUntil, at(-3));
    assert.equal(e.graceUntil, at(4));
  });

  it('past_due beyond grace is issued as the free plan, never as an expired paid one (Q14)', () => {
    const e = computeEntitlement(
      BIZ,
      { planId: 'xangarro', status: 'past_due', currentPeriodEnd: at(-8) },
      NOW,
    );
    assert.equal(e.plan, 'xangarrito');
    assert.ok(Date.parse(e.validUntil) > NOW.getTime() + 36_000 * DAY);
  });

  it('lapsed and no subscription at all both get the free plan for a century', () => {
    for (const sub of [
      { planId: 'xangarro', status: 'lapsed' as const, currentPeriodEnd: at(-40) },
      null,
    ]) {
      const e = computeEntitlement(BIZ, sub, NOW);
      assert.equal(e.plan, 'xangarrito');
      assert.equal(e.limits.devices, PLAN_LIMITS.xangarrito.devices);
      assert.equal(e.validUntil, e.graceUntil);
      assert.ok(Date.parse(e.validUntil) > NOW.getTime() + 36_000 * DAY);
    }
  });

  it('an unknown plan throws a typed error rather than guessing', () => {
    assert.throws(
      () =>
        computeEntitlement(
          BIZ,
          { planId: 'enterprise', status: 'active', currentPeriodEnd: at(10) },
          NOW,
        ),
      (e: unknown) => e instanceof UnknownPlanError && e.code === 'UNKNOWN_PLAN',
    );
  });

  it('a paid status with no period end throws a typed error', () => {
    assert.throws(
      () =>
        computeEntitlement(
          BIZ,
          { planId: 'xangarro', status: 'active', currentPeriodEnd: null },
          NOW,
        ),
      (e: unknown) => e instanceof MissingPeriodEndError && e.code === 'MISSING_PERIOD_END',
    );
  });

  it('what it returns always satisfies the contract schema', async () => {
    const { EntitlementSchema } = await import('@xangarro/domain');
    const e = computeEntitlement(
      BIZ,
      { planId: 'xangarrito', status: 'free', currentPeriodEnd: null },
      NOW,
    );
    assert.equal(EntitlementSchema.safeParse(e).success, true);
  });
});
