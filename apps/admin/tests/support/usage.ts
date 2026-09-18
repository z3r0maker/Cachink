import type { BusinessId, PlanOverride } from '@xangarro/domain';
import type { UsageRecord } from '@xangarro/domain/usage';

import { unknownBillingSource } from '@/server/billing/stub';
import type { UsageListDeps } from '@/server/usage/list';
import { InMemoryUsageSource } from '@/server/usage/memory';
import { InMemoryPlanOverrides } from '@/server/tenants/memory';

import { at, bid, overrideIds, STAFF } from './tenants';

/** `n` counted sales (pre-ticket one-line sales, as on main) at `iso`. */
export const sales = (n: number, iso: string): UsageRecord[] =>
  Array.from({ length: n }, () => ({ kind: 'ventaLinea', at: iso, ticketId: null }));

export interface UsageFixture {
  readonly source: InMemoryUsageSource;
  readonly overrides: InMemoryPlanOverrides;
  readonly deps: UsageListDeps;
  add(n: number, records?: readonly UsageRecord[]): BusinessId;
}

export function usageFixture(): UsageFixture {
  const source = new InMemoryUsageSource();
  const overrides = new InMemoryPlanOverrides();
  return {
    source,
    overrides,
    deps: { usage: source, billing: unknownBillingSource, overrides },
    add(n, records = []) {
      const id = bid(n);
      source.tenants.set(id, { id, nombre: `Negocio ${n}`, createdAt: at((n % 28) + 1) });
      source.records.set(id, [...records]);
      return id;
    },
  };
}

/** An active "regalar plan" of xangarro for `id`. */
export function comp(id: BusinessId): PlanOverride {
  return {
    id: overrideIds()(),
    businessId: id,
    createdBy: STAFF,
    createdAt: at(1),
    kind: 'comp_plan',
    planId: 'xangarro',
    reason: 'Beta cerrada',
    expiresAt: at(30),
  };
}
