import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  effectivePlan,
  PlanOverrideSchema,
  type PlanOverride,
} from '../../src/entities/plan-override.js';

const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0C7BK0';
const STAFF = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const CREATED = '2026-09-01T12:00:00.000Z';
const NOW = new Date('2026-09-17T12:00:00.000Z');

let n = 0;
function id(): string {
  n += 1;
  return `01HZ8XQN9GZJXV8AKQ5X0C${String(n).padStart(4, '0')}`;
}

function comp(planId: string, expiresAt: string, extra: Partial<PlanOverride> = {}): PlanOverride {
  return PlanOverrideSchema.parse({
    id: id(),
    businessId: BUSINESS,
    createdBy: STAFF,
    createdAt: CREATED,
    kind: 'comp_plan',
    planId,
    reason: 'Beta cerrada (N-30)',
    expiresAt,
    ...extra,
  });
}

function extend(days: number, expiresAt: string): PlanOverride {
  return PlanOverrideSchema.parse({
    id: id(),
    businessId: BUSINESS,
    createdBy: STAFF,
    createdAt: CREATED,
    kind: 'extend_trial',
    days,
    expiresAt,
  });
}

function reissue(createdAt: string = CREATED): PlanOverride {
  return PlanOverrideSchema.parse({
    id: id(),
    businessId: BUSINESS,
    createdBy: STAFF,
    createdAt,
    kind: 'reissue_entitlement',
    expiresAt: null,
  });
}

const LATER = '2026-10-15T12:00:00.000Z';
const PAST = '2026-09-10T12:00:00.000Z';

describe('PlanOverrideSchema', () => {
  it('accepts each of the three kinds', () => {
    assert.equal(comp('xangarrote', LATER).kind, 'comp_plan');
    assert.equal(extend(7, LATER).kind, 'extend_trial');
    assert.equal(reissue().kind, 'reissue_entitlement');
  });

  it('requires an expiry for extend_trial and comp_plan', () => {
    const base = { id: id(), businessId: BUSINESS, createdBy: STAFF, createdAt: CREATED };
    const noExpiryComp = { ...base, kind: 'comp_plan', planId: 'xangarro', reason: 'Beta' };
    assert.equal(PlanOverrideSchema.safeParse({ ...noExpiryComp, expiresAt: null }).success, false);
    const noExpiryExt = { ...base, kind: 'extend_trial', days: 7, expiresAt: null };
    assert.equal(PlanOverrideSchema.safeParse(noExpiryExt).success, false);
  });

  it('rejects an expiry that is not after creation', () => {
    assert.throws(() => comp('xangarro', CREATED));
    assert.throws(() => extend(7, '2026-08-01T00:00:00.000Z'));
  });

  it('rejects comping the free plan, a blank reason, and out-of-range days', () => {
    assert.throws(() => comp('xangarrito', LATER));
    assert.throws(() => comp('xangarro', LATER, { reason: '  ' } as Partial<PlanOverride>));
    assert.throws(() => extend(0, LATER));
    assert.throws(() => extend(91, LATER));
    assert.throws(() => extend(1.5, LATER));
  });
});

describe('effectivePlan', () => {
  it('an active comp lifts the plan until it expires', () => {
    const c = comp('xangarrote', LATER);
    const result = effectivePlan('xangarrito', [c], NOW);
    assert.equal(result.plan, 'xangarrote');
    assert.equal(result.compedBy, c.id);
    assert.equal(result.compedUntil, LATER);
  });

  it('an expired comp reverts to the base plan', () => {
    const result = effectivePlan('xangarro', [comp('xangarrote', PAST)], NOW);
    assert.equal(result.plan, 'xangarro');
    assert.equal(result.compedBy, null);
    assert.equal(result.compedUntil, null);
  });

  it('overlapping comps: the highest plan wins', () => {
    const low = comp('xangarro', '2026-12-01T00:00:00.000Z');
    const high = comp('xangarrote', LATER);
    assert.equal(effectivePlan('xangarrito', [low, high], NOW).plan, 'xangarrote');
    assert.equal(effectivePlan('xangarrito', [high, low], NOW).compedBy, high.id);
  });

  it('a comp never downgrades a higher paid plan', () => {
    const result = effectivePlan('xangarrote', [comp('xangarro', LATER)], NOW);
    assert.equal(result.plan, 'xangarrote');
    assert.equal(result.compedBy, null);
  });

  it('a reissue does not change the plan, it only marks when it was asked for', () => {
    const r = reissue('2026-09-16T08:00:00.000Z');
    const result = effectivePlan('xangarro', [reissue(), r], NOW);
    assert.equal(result.plan, 'xangarro');
    assert.equal(result.compedBy, null);
    assert.equal(result.reissueRequestedAt, '2026-09-16T08:00:00.000Z');
    assert.equal(result.trialExtensionDays, 0);
  });

  it('adds the days of every active trial extension, ignoring expired ones', () => {
    const result = effectivePlan(
      'xangarro',
      [extend(7, LATER), extend(5, LATER), extend(30, PAST)],
      NOW,
    );
    assert.equal(result.trialExtensionDays, 12);
    assert.equal(result.plan, 'xangarro');
  });

  it('ignores an override created after `now`', () => {
    const future = comp('xangarrote', '2026-12-01T00:00:00.000Z', {
      createdAt: '2026-09-18T00:00:00.000Z',
    } as Partial<PlanOverride>);
    assert.equal(effectivePlan('xangarrito', [future], NOW).plan, 'xangarrito');
  });

  it('treats the expiry instant itself as expired', () => {
    const c = comp('xangarrote', NOW.toISOString());
    assert.equal(effectivePlan('xangarrito', [c], NOW).plan, 'xangarrito');
  });

  it('with no overrides it is the base plan and nothing else', () => {
    assert.deepEqual(effectivePlan('xangarrito', [], NOW), {
      plan: 'xangarrito',
      compedBy: null,
      compedUntil: null,
      trialExtensionDays: 0,
      reissueRequestedAt: null,
    });
  });
});
