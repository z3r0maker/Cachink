/**
 * RefreshUsageUseCase — one business's usage for the open month, recounted
 * right after a push lands (N-02, ADR-065 row 9: «computed on each push + a
 * nightly job»).
 *
 * A **recount from source**, not an increment: the same `usage_counts` SQL
 * the nightly job runs, scoped to one business and one month. So the count a
 * phone pulls is never older than its last push, and there is no second rule
 * for what a pushed row is worth (tickets versus lines, manual versus sale
 * movements) that could drift from the nightly one. Notices stay the nightly
 * job's: a threshold email is not worth delaying a push for.
 */
import { usagePeriod, type UsageSnapshot } from '@xangarro/domain/usage';

import type { UsageCountSource, UsageCounterStore } from './ports.js';

export interface RefreshUsageDeps {
  readonly counts: UsageCountSource;
  readonly store: UsageCounterStore;
  readonly now: () => Date;
}

export class UsageRefreshError extends Error {
  readonly code = 'USAGE_REFRESH_INVALID' as const;
  constructor(message: string) {
    super(message);
    this.name = 'UsageRefreshError';
  }
}

export class RefreshUsageUseCase {
  readonly #deps: RefreshUsageDeps;

  constructor(deps: RefreshUsageDeps) {
    this.#deps = deps;
  }

  /** The stored row, or null for a business the count does not know (archived, or never seen). */
  async execute(businessId: string): Promise<UsageSnapshot | null> {
    if (businessId.trim() === '') throw new UsageRefreshError('Falta el negocio a recontar.');
    const at = this.#deps.now();
    const period = usagePeriod(at);
    const rows = await this.#deps.counts.count(period, period, [businessId]);
    const mine = rows.filter((r) => r.businessId === businessId);
    if (mine.length === 0) return null;
    await this.#deps.store.save(mine, at.toISOString());
    return mine[0] ?? null;
  }
}
