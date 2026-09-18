import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PLAN_LIMITS } from '@xangarro/domain';

import { unknownBillingSource } from '@/server/billing/stub';
import { loadTenant } from '@/server/tenants/detail';
import { TenantError } from '@/server/tenants/errors';
import { InMemoryPlanOverrides } from '@/server/tenants/memory';

import { at, bid, directory, failing, NOW, overrideIds, STAFF, tenant } from './support/tenants';

function setup() {
  const dir = directory(tenant(1));
  dir.memberRows.set(bid(1), [{ userId: 'u-1', email: 'dueno1@ejemplo.mx', role: 'owner' }]);
  dir.deviceRows.set(bid(1), [
    { id: 'd-1', nombre: 'Caja 1', plataforma: 'android', lastSeenAt: at(16), revokedAt: null },
  ]);
  const overrides = new InMemoryPlanOverrides();
  return { deps: { directory: dir, overrides, billing: unknownBillingSource }, overrides };
}

const rejectsWith = (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof TenantError && e.code === code);

describe('loadTenant', () => {
  it('gathers members, devices, billing, overrides and the entitlement of the effective plan', async () => {
    const { deps, overrides } = setup();
    const newId = overrideIds();
    const comp = {
      id: newId(),
      businessId: bid(1),
      createdBy: STAFF,
      createdAt: at(10),
      kind: 'comp_plan' as const,
      planId: 'xangarro' as const,
      reason: 'Beta',
      expiresAt: at(30),
    };
    const expired = { ...comp, id: newId(), planId: 'xangarrote' as const, expiresAt: at(12) };
    await overrides.insert(comp);
    await overrides.insert(expired);

    const t = await loadTenant(deps, bid(1), NOW);
    assert.equal(t.summary.nombre, 'Negocio 1');
    assert.equal(t.members[0]?.role, 'owner');
    assert.equal(t.devices[0]?.nombre, 'Caja 1');
    assert.equal(t.billing.status, 'unknown');
    assert.equal(t.overrides.length, 2);
    assert.equal(t.plan.effective, 'xangarro');
    assert.equal(t.plan.effect.compedBy, comp.id);
    assert.deepEqual(t.limits, PLAN_LIMITS.xangarro);
  });

  it('with no billing data and no comp, the entitlement shown is the fallback plan', async () => {
    const { deps } = setup();
    const t = await loadTenant(deps, bid(1), NOW);
    assert.equal(t.plan.effective, null);
    assert.deepEqual(t.limits, PLAN_LIMITS.xangarrito);
  });

  it('refuses a malformed id', async () => {
    await rejectsWith(loadTenant(setup().deps, 'x', NOW), 'VALIDATION');
  });

  it('reports a missing tenant as NOT_FOUND', async () => {
    await rejectsWith(loadTenant(setup().deps, bid(2), NOW), 'NOT_FOUND');
  });

  it('turns a database failure into STORE_FAILED', async () => {
    const deps = { ...setup().deps, directory: failing.directory() };
    await rejectsWith(loadTenant(deps, bid(1), NOW), 'STORE_FAILED');
  });
});
