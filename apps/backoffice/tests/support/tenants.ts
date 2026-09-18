import type { BusinessId, PlanOverrideId, StaffMemberId } from '@xangarro/domain';

import type { BillingSnapshot, BillingStatusSource } from '@/server/billing/port';
import { UNKNOWN_BILLING } from '@/server/billing/port';
import { InMemoryPlanOverrides, InMemoryTenantDirectory } from '@/server/tenants/memory';
import type { TenantSummary } from '@/server/tenants/port';

export const STAFF = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as StaffMemberId;
export const NOW = new Date('2026-09-17T18:00:00.000Z');

export const bid = (n: number) =>
  `01HZ8XQN9GZJXV8AKQ5X0B${String(n).padStart(4, '0')}` as BusinessId;
export const at = (day: number) => new Date(Date.UTC(2026, 8, day, 12)).toISOString();

export function tenant(n: number, overrides: Partial<TenantSummary> = {}): TenantSummary {
  return {
    id: bid(n),
    nombre: `Negocio ${n}`,
    createdAt: at(n),
    ownerEmail: `dueno${n}@ejemplo.mx`,
    devicesTotal: 1,
    devicesActive: 1,
    lastSyncAt: at(16),
    lastOwnerLoginAt: null,
    ...overrides,
  };
}

export function directory(...rows: TenantSummary[]): InMemoryTenantDirectory {
  const d = new InMemoryTenantDirectory();
  for (const r of rows) d.tenants.set(r.id, r);
  return d;
}

/** Deterministic override ids: a fixed prefix plus a counter. */
export function overrideIds(): () => PlanOverrideId {
  let n = 0;
  return () => {
    n += 1;
    return `01HZ8XQN9GZJXV8AKQ5X0D${String(n).padStart(4, '0')}` as PlanOverrideId;
  };
}

/** A billing source that knows exactly the snapshots it is given. */
export function knownBilling(known: ReadonlyMap<BusinessId, BillingSnapshot>): BillingStatusSource {
  return {
    known: true,
    async snapshots(ids) {
      return new Map(ids.map((id) => [id, known.get(id) ?? UNKNOWN_BILLING]));
    },
    async matching(filter) {
      if (filter.plan === undefined && filter.status === undefined) return { kind: 'all' };
      const businessIds = [...known.entries()]
        .filter(([, s]) => (filter.plan ?? s.planId) === s.planId)
        .filter(([, s]) => (filter.status ?? s.status) === s.status)
        .map(([id]) => id);
      return { kind: 'only', businessIds };
    },
  };
}

export const failing = {
  directory(): InMemoryTenantDirectory {
    const d = new InMemoryTenantDirectory();
    const boom = () => Promise.reject(new Error('connection refused'));
    d.list = boom;
    d.find = boom;
    return d;
  },
  overrides(): InMemoryPlanOverrides {
    const o = new InMemoryPlanOverrides();
    o.insert = () => Promise.reject(new Error('connection refused'));
    return o;
  },
};
