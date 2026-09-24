import type { SupportItem, SupportItemId } from '@xangarro/domain';

import type { ListCursor, SupportItemQuery, SupportItemRepository } from './port';

/**
 * In-memory `SupportItemRepository` — the reference implementation of the
 * port's contract, used by every inbox test. The Postgres adapter
 * (`../db/support-items.ts`) must behave the same way.
 */
export class InMemorySupportItems implements SupportItemRepository {
  readonly rows = new Map<SupportItemId, SupportItem>();

  async findById(id: SupportItemId): Promise<SupportItem | null> {
    return this.rows.get(id) ?? null;
  }

  async insertIfAbsent(item: SupportItem): Promise<{ item: SupportItem; created: boolean }> {
    for (const row of this.rows.values()) {
      if (row.source === item.source && row.sourceRef === item.sourceRef) {
        return { item: row, created: false };
      }
    }
    this.rows.set(item.id, item);
    return { item, created: true };
  }

  async update(item: SupportItem): Promise<void> {
    this.rows.set(item.id, item);
  }

  async list(q: SupportItemQuery): Promise<SupportItem[]> {
    return [...this.rows.values()]
      .filter((r) => matches(r, q))
      .sort(newestFirst)
      .filter((r) => q.after === null || isAfter(r, q.after))
      .slice(0, q.limit);
  }

  async listForDigest(since: string): Promise<SupportItem[]> {
    const sinceMs = Date.parse(since);
    return [...this.rows.values()]
      .filter(
        (r) =>
          Date.parse(r.createdAt) >= sinceMs ||
          (r.status !== 'resuelto' && (r.urgent || r.kind === 'factura' || r.kind === 'arco')),
      )
      .sort(newestFirst);
  }
}

function matches(r: SupportItem, q: SupportItemQuery): boolean {
  if (q.kinds && !q.kinds.includes(r.kind)) return false;
  if (q.statuses && !q.statuses.includes(r.status)) return false;
  if (q.urgent !== undefined && r.urgent !== q.urgent) return false;
  if (q.ownerStaffId !== undefined && r.ownerStaffId !== q.ownerStaffId) return false;
  if (q.businessId !== undefined && r.businessId !== q.businessId) return false;
  return true;
}

function newestFirst(a: SupportItem, b: SupportItem): number {
  const byTime = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** Strictly after the cursor in `newestFirst` order. */
function isAfter(r: SupportItem, c: ListCursor): boolean {
  const rt = Date.parse(r.createdAt);
  const ct = Date.parse(c.createdAt);
  return rt < ct || (rt === ct && r.id < c.id);
}
