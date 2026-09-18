import type { BusinessId } from '@xangarro/domain';
import { computeUsage, type UsageRecord } from '@xangarro/domain/usage';

import { previousUsagePeriod } from './limits';
import type { TenantUsage, UsageCursor, UsagePageQuery, UsageSource } from './port';

export interface UsageTenant {
  readonly id: BusinessId;
  readonly nombre: string;
  readonly createdAt: string;
}

/**
 * In-memory `UsageSource` — the reference implementation of the port, built
 * on the domain's `computeUsage`, so the SQL adapter is held to the domain's
 * counting rules. `UsageRecord` products carry no creation time, so here the
 * active-product count is the same point-in-time figure for every month.
 */
export class InMemoryUsageSource implements UsageSource {
  readonly tenants = new Map<BusinessId, UsageTenant>();
  readonly records = new Map<BusinessId, UsageRecord[]>();
  /** Every query received, for tests that check the scan. */
  readonly queries: UsagePageQuery[] = [];

  async page(q: UsagePageQuery): Promise<TenantUsage[]> {
    this.queries.push(q);
    const prev = previousUsagePeriod(q.period);
    const periods = [q.period, prev, previousUsagePeriod(prev)];
    return [...this.tenants.values()]
      .sort(newestFirst)
      .filter((t) => q.after === null || isAfter(t, q.after))
      .slice(0, q.limit)
      .map((t) => {
        const records = this.records.get(t.id) ?? [];
        return { ...t, history: periods.map((p) => ({ period: p, ...computeUsage(records, p) })) };
      });
  }
}

function newestFirst(a: UsageTenant, b: UsageTenant): number {
  const byTime = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function isAfter(t: UsageTenant, c: UsageCursor): boolean {
  const tt = Date.parse(t.createdAt);
  const ct = Date.parse(c.createdAt);
  return tt < ct || (tt === ct && t.id < c.id);
}
