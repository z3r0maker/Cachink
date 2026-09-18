import { isOverrideActive, type BusinessId, type PlanOverride } from '@xangarro/domain';

import type {
  PlanOverrideRepository,
  TenantCursor,
  TenantDevice,
  TenantDirectory,
  TenantMember,
  TenantQuery,
  TenantSummary,
} from './port';

/**
 * In-memory tenant ports — the reference implementation of their contracts,
 * used by every tenant test. The Postgres adapters must behave the same way.
 */
export class InMemoryTenantDirectory implements TenantDirectory {
  readonly tenants = new Map<BusinessId, TenantSummary>();
  readonly memberRows = new Map<BusinessId, TenantMember[]>();
  readonly deviceRows = new Map<BusinessId, TenantDevice[]>();

  async list(q: TenantQuery): Promise<TenantSummary[]> {
    return [...this.tenants.values()]
      .filter((t) => matches(t, q))
      .sort(newestFirst)
      .filter((t) => q.after === null || isAfter(t, q.after))
      .slice(0, q.limit);
  }

  async find(id: BusinessId): Promise<TenantSummary | null> {
    return this.tenants.get(id) ?? null;
  }

  async members(id: BusinessId): Promise<TenantMember[]> {
    return this.memberRows.get(id) ?? [];
  }

  async devices(id: BusinessId): Promise<TenantDevice[]> {
    return this.deviceRows.get(id) ?? [];
  }
}

function matches(t: TenantSummary, q: TenantQuery): boolean {
  if (q.onlyIds && !q.onlyIds.includes(t.id)) return false;
  const synced = t.lastSyncAt === null ? null : Date.parse(t.lastSyncAt);
  if (q.staleBefore !== undefined && synced !== null && synced >= Date.parse(q.staleBefore)) {
    return false;
  }
  if (q.search !== undefined) {
    const s = q.search.toLowerCase();
    const hit =
      t.id === q.search ||
      t.nombre.toLowerCase().includes(s) ||
      (t.ownerEmail ?? '').toLowerCase().includes(s);
    if (!hit) return false;
  }
  return true;
}

function newestFirst(a: TenantSummary, b: TenantSummary): number {
  const byTime = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function isAfter(t: TenantSummary, c: TenantCursor): boolean {
  const tt = Date.parse(t.createdAt);
  const ct = Date.parse(c.createdAt);
  return tt < ct || (tt === ct && t.id < c.id);
}

export class InMemoryPlanOverrides implements PlanOverrideRepository {
  readonly rows: PlanOverride[] = [];

  async insert(override: PlanOverride): Promise<void> {
    this.rows.push(override);
  }

  async listFor(businessId: BusinessId): Promise<PlanOverride[]> {
    return this.rows
      .filter((o) => o.businessId === businessId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async activeFor(ids: readonly BusinessId[], now: Date): Promise<PlanOverride[]> {
    return this.rows.filter((o) => ids.includes(o.businessId) && isOverrideActive(o, now));
  }
}
