/**
 * RefreshUsageUseCase — one business's usage for the open month, recounted
 * right after a push lands (N-02, ADR-065 row 9: «computed on each push + a
 * nightly job»).
 *
 * A **recount from source**, not an increment: the same `usage_counts` SQL
 * the nightly job runs, scoped to one business and one month. So there is no
 * second rule for what a pushed row is worth (tickets versus lines, manual
 * versus sale movements) that could drift from the nightly one. Notices stay
 * the nightly job's: a threshold email is not worth delaying a push for.
 *
 * **At most once a minute per business** (audit DB2-USE-01). The recount reads
 * the month's rows, and a phone that pushes each sale as it happens would run
 * it per sale. So a month counted less than `REFRESH_MIN_INTERVAL_MS` ago is
 * left as it is: the count a phone pulls may miss the last minute's pushes,
 * until the next push after that minute or the nightly job.
 */
import { usagePeriod, type UsagePeriod, type UsageSnapshot } from '@xangarro/domain/usage';

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

export const REFRESH_MIN_INTERVAL_MS = 60_000;

export class RefreshUsageUseCase {
  readonly #deps: RefreshUsageDeps;

  constructor(deps: RefreshUsageDeps) {
    this.#deps = deps;
  }

  /**
   * The stored row, or null when nothing was recounted: the month was counted
   * under a minute ago, or the count does not know the business (archived, or
   * never seen).
   */
  async execute(businessId: string): Promise<UsageSnapshot | null> {
    if (businessId.trim() === '') throw new UsageRefreshError('Falta el negocio a recontar.');
    const at = this.#deps.now();
    const period = usagePeriod(at);
    if (await this.#countedRecently(businessId, period, at)) return null;
    const rows = await this.#deps.counts.count(period, period, [businessId]);
    const mine = rows.filter((r) => r.businessId === businessId);
    if (mine.length === 0) return null;
    await this.#deps.store.save(mine, at.toISOString());
    return mine[0] ?? null;
  }

  /** A count stamped in the future (a skewed clock) is not trusted as recent. */
  async #countedRecently(businessId: string, period: UsagePeriod, at: Date): Promise<boolean> {
    const last = await this.#deps.store.computedAt(businessId, period);
    if (last === null) return false;
    const age = at.getTime() - Date.parse(last);
    return age >= 0 && age < REFRESH_MIN_INTERVAL_MS;
  }
}
