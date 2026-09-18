import type { PlatformFlag, PlatformFlagKey, StaffMemberId } from '@xangarro/domain';

import type { PlatformFlagEvent, PlatformFlagStore } from './port';

/** Newest first: by instant, then by ULID — the same order as the SQL view. */
function newestFirst(a: PlatformFlagEvent, b: PlatformFlagEvent): number {
  const byTime = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function withoutId({ id: _id, ...flag }: PlatformFlagEvent): PlatformFlag {
  return flag;
}

/**
 * In-memory `PlatformFlagStore` — the reference implementation of its
 * contract, used by every flag test. The Postgres adapter must match it.
 */
export class InMemoryPlatformFlags implements PlatformFlagStore {
  readonly events: PlatformFlagEvent[] = [];
  readonly names = new Map<StaffMemberId, string>();
  tenants = 0;

  async append(event: PlatformFlagEvent): Promise<void> {
    this.events.push(event);
  }

  async current(): Promise<PlatformFlag[]> {
    const latest = new Map<PlatformFlagKey, PlatformFlagEvent>();
    for (const e of [...this.events].sort(newestFirst)) {
      if (!latest.has(e.key)) latest.set(e.key, e);
    }
    return [...latest.values()].map(withoutId);
  }

  async history(key: PlatformFlagKey, limit: number): Promise<PlatformFlagEvent[]> {
    return this.events
      .filter((e) => e.key === key)
      .sort(newestFirst)
      .slice(0, limit);
  }

  async tenantCount(): Promise<number> {
    return this.tenants;
  }

  async staffNames(ids: readonly StaffMemberId[]): Promise<Map<StaffMemberId, string>> {
    const out = new Map<StaffMemberId, string>();
    for (const id of ids) {
      const name = this.names.get(id);
      if (name !== undefined) out.set(id, name);
    }
    return out;
  }
}
