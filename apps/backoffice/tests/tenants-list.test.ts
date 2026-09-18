import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { BusinessId } from '@xangarro/domain';

import { UNKNOWN_BILLING } from '@/server/billing/port';
import { unknownBillingSource } from '@/server/billing/stub';
import { TenantError } from '@/server/tenants/errors';
import { listTenants, STALE_AFTER_DAYS } from '@/server/tenants/list';
import { InMemoryPlanOverrides } from '@/server/tenants/memory';

import {
  at,
  bid,
  directory,
  failing,
  knownBilling,
  NOW,
  overrideIds,
  STAFF,
  tenant,
} from './support/tenants';

const rows = [
  tenant(1, { nombre: 'Tacos Don Pepe', lastSyncAt: null }),
  tenant(2, { nombre: 'Ferretería La Tuerca', lastSyncAt: at(2) }),
  tenant(3, { ownerEmail: 'ana@tuerca.mx' }),
  tenant(4),
  tenant(5),
];

function deps(overrides = new InMemoryPlanOverrides(), billing = unknownBillingSource) {
  return { directory: directory(...rows), billing, overrides };
}

const ids = (r: { tenants: readonly { summary: { id: BusinessId } }[] }) =>
  r.tenants.map((t) => t.summary.id);

describe('listTenants', () => {
  it('returns newest first and pages by keyset without skipping or repeating', async () => {
    const d = deps();
    const seen: BusinessId[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page += 1) {
      const res = await listTenants(d, { limit: 2, cursor }, NOW);
      seen.push(...ids(res));
      if (res.nextCursor === null) break;
      cursor = res.nextCursor;
    }
    assert.deepEqual(seen, [bid(5), bid(4), bid(3), bid(2), bid(1)]);
  });

  it('searches by name, owner email or exact id', async () => {
    const d = deps();
    assert.deepEqual(ids(await listTenants(d, { q: 'tuerca' }, NOW)), [bid(3), bid(2)]);
    assert.deepEqual(ids(await listTenants(d, { q: bid(4) }, NOW)), [bid(4)]);
  });

  it(`"sin sincronizar" keeps tenants idle more than ${STALE_AFTER_DAYS} days or never synced`, async () => {
    assert.deepEqual(ids(await listTenants(deps(), { stale: true }, NOW)), [bid(2), bid(1)]);
  });

  it('joins the billing snapshot and shows an active comp as the plan', async () => {
    const overrides = new InMemoryPlanOverrides();
    await overrides.insert({
      id: overrideIds()(),
      businessId: bid(4),
      createdBy: STAFF,
      createdAt: at(10),
      kind: 'comp_plan',
      planId: 'xangarrote',
      reason: 'Beta cerrada',
      expiresAt: at(30),
    });
    const res = await listTenants(deps(overrides), {}, NOW);
    const four = res.tenants.find((t) => t.summary.id === bid(4));
    assert.equal(four?.billing, UNKNOWN_BILLING);
    assert.equal(four?.plan.effective, 'xangarrote');
    assert.equal(four?.plan.base, null);
    assert.equal(res.tenants.find((t) => t.summary.id === bid(5))?.plan.effective, null);
  });

  it('filters by plan and status through the billing source', async () => {
    const snap = { ...UNKNOWN_BILLING, planId: 'xangarro' as const, status: 'past_due' as const };
    const billing = knownBilling(new Map([[bid(3), snap]]));
    const d = deps(new InMemoryPlanOverrides(), billing);
    assert.deepEqual(ids(await listTenants(d, { plan: 'xangarro' }, NOW)), [bid(3)]);
    assert.deepEqual(ids(await listTenants(d, { status: 'past_due' }, NOW)), [bid(3)]);
    assert.deepEqual(ids(await listTenants(d, { status: 'active' }, NOW)), []);
  });

  it('with the stub, a known plan or status matches nobody and says why', async () => {
    const res = await listTenants(deps(), { plan: 'xangarro' }, NOW);
    assert.deepEqual(ids(res), []);
    assert.equal(res.billingKnown, false);
  });

  it('rejects an unknown plan or status', async () => {
    for (const bad of [{ plan: 'oro' }, { status: 'cancelado' }, { limit: 0 }]) {
      await assert.rejects(listTenants(deps(), bad, NOW), (e: unknown) => {
        return e instanceof TenantError && e.code === 'VALIDATION';
      });
    }
  });

  it('rejects a cursor it did not issue', async () => {
    await assert.rejects(listTenants(deps(), { cursor: 'basura' }, NOW), (e: unknown) => {
      return e instanceof TenantError && e.code === 'INVALID_CURSOR';
    });
  });

  it('turns a database failure into STORE_FAILED', async () => {
    const d = { ...deps(), directory: failing.directory() };
    await assert.rejects(listTenants(d, {}, NOW), (e: unknown) => {
      return e instanceof TenantError && e.code === 'STORE_FAILED';
    });
  });
});
