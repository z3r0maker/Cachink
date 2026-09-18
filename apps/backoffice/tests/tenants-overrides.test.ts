import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { TenantError } from '@/server/tenants/errors';
import { InMemoryPlanOverrides } from '@/server/tenants/memory';
import { createPlanOverride, TRIAL_DAYS } from '@/server/tenants/overrides';

import { bid, directory, failing, NOW, overrideIds, STAFF, tenant } from './support/tenants';

const DAY = 86_400_000;

function setup(overrides = new InMemoryPlanOverrides()) {
  const deps = {
    directory: directory(tenant(1)),
    overrides,
    staffId: STAFF,
    now: () => NOW,
    newId: overrideIds(),
  };
  return { deps, overrides };
}

const rejectsWith = (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof TenantError && e.code === code);

describe('createPlanOverride', () => {
  it('comp_plan: stores the plan, reason and the end of the chosen day in CDMX', async () => {
    const { deps, overrides } = setup();
    const o = await createPlanOverride(deps, {
      businessId: bid(1),
      kind: 'comp_plan',
      planId: 'xangarrote',
      reason: 'Beta cerrada (N-30)',
      hasta: '2026-10-15',
    });
    assert.equal(o.kind, 'comp_plan');
    assert.equal(o.createdBy, STAFF);
    assert.equal(o.createdAt, NOW.toISOString());
    assert.equal(o.expiresAt, '2026-10-16T06:00:00.000Z');
    assert.deepEqual(overrides.rows, [o]);
  });

  it('extend_trial: stays active long enough to cover any running trial', async () => {
    const { deps } = setup();
    const o = await createPlanOverride(deps, {
      businessId: bid(1),
      kind: 'extend_trial',
      days: '7',
    });
    assert.equal(o.kind === 'extend_trial' && o.days, 7);
    assert.equal(Date.parse(o.expiresAt ?? ''), NOW.getTime() + (TRIAL_DAYS + 7) * DAY);
  });

  it('reissue_entitlement: a flag with no expiry', async () => {
    const { deps } = setup();
    const o = await createPlanOverride(deps, { businessId: bid(1), kind: 'reissue_entitlement' });
    assert.equal(o.expiresAt, null);
  });

  it('refuses a comp without a reason, of the free plan, or ending in the past', async () => {
    const { deps, overrides } = setup();
    const base = { businessId: bid(1), kind: 'comp_plan', planId: 'xangarro', hasta: '2026-10-15' };
    await rejectsWith(createPlanOverride(deps, { ...base, reason: '' }), 'VALIDATION');
    await rejectsWith(
      createPlanOverride(deps, { ...base, reason: 'Beta', planId: 'xangarrito' }),
      'VALIDATION',
    );
    await rejectsWith(
      createPlanOverride(deps, { ...base, reason: 'Beta', hasta: '2026-09-01' }),
      'VALIDATION',
    );
    assert.equal(overrides.rows.length, 0);
  });

  it('refuses a comp more than a year out and a trial extension out of range', async () => {
    const { deps } = setup();
    const comp = { businessId: bid(1), kind: 'comp_plan', planId: 'xangarro', reason: 'Beta' };
    await rejectsWith(createPlanOverride(deps, { ...comp, hasta: '2028-01-01' }), 'VALIDATION');
    for (const days of ['0', '91', 'siete', '']) {
      const input = { businessId: bid(1), kind: 'extend_trial', days };
      await rejectsWith(createPlanOverride(deps, input), 'VALIDATION');
    }
  });

  it('refuses an unknown kind and a malformed business id', async () => {
    const { deps } = setup();
    await rejectsWith(
      createPlanOverride(deps, { businessId: bid(1), kind: 'regalo' }),
      'VALIDATION',
    );
    const input = { businessId: 'nope', kind: 'reissue_entitlement' };
    await rejectsWith(createPlanOverride(deps, input), 'VALIDATION');
  });

  it('refuses a business that does not exist', async () => {
    const { deps } = setup();
    const input = { businessId: bid(9), kind: 'reissue_entitlement' };
    await rejectsWith(createPlanOverride(deps, input), 'NOT_FOUND');
  });

  it('turns a failed insert into STORE_FAILED', async () => {
    const { deps } = setup(failing.overrides());
    const input = { businessId: bid(1), kind: 'reissue_entitlement' };
    await rejectsWith(createPlanOverride(deps, input), 'STORE_FAILED');
  });
});
