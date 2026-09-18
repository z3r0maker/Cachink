/**
 * RecomputeUsageUseCase — the nightly usage job (N-02) and its notices (N-03).
 *
 * 1. Recount every live business for the open MX month and the one before it
 *    from source rows (`xangarro.usage_counts()`, the single SQL count), so
 *    late pushes and any drift are absorbed within a day.
 * 2. Store the counts in `usage_counters`.
 * 3. Per business: threshold notices for the open month (owner at 80/100 %,
 *    provider inbox at 100/150 %) and "sugerir upgrade" when the last two
 *    closed months were both over — each exactly once (ledger).
 *
 * Counting or storing failing fails the run (the cron answers 500 and runs
 * again tomorrow). A business whose notices fail is reported in `failures`
 * and retried on the next run; the others still get theirs.
 */

import { previousUsagePeriod, usagePeriod, type UsageSnapshot } from '@xangarro/domain/usage';

import type { SupportInbox } from '../support-inbox/index.js';
import { notifyBusiness } from './notify-business.js';
import type {
  UsageCountSource,
  UsageCounterStore,
  UsageLimitsSource,
  UsageNoticeLedger,
  UsageThresholdNotifier,
} from './ports.js';

export interface RecomputeUsageDeps {
  readonly counts: UsageCountSource;
  readonly store: UsageCounterStore;
  readonly limits: UsageLimitsSource;
  readonly ledger: UsageNoticeLedger;
  readonly owner: UsageThresholdNotifier;
  readonly inbox: SupportInbox;
  readonly now: () => Date;
}

export interface RecomputeUsageResult {
  readonly current: string;
  readonly previous: string;
  readonly businesses: number;
  /** Notices sent by this run (owner + provider). */
  readonly notices: number;
  readonly failures: readonly { readonly businessId: string; readonly error: string }[];
}

function byBusiness(rows: readonly UsageSnapshot[]): Map<string, UsageSnapshot[]> {
  const out = new Map<string, UsageSnapshot[]>();
  for (const r of rows) out.set(r.businessId, [...(out.get(r.businessId) ?? []), r]);
  return out;
}

export class RecomputeUsageUseCase {
  readonly #deps: RecomputeUsageDeps;

  constructor(deps: RecomputeUsageDeps) {
    this.#deps = deps;
  }

  async execute(): Promise<RecomputeUsageResult> {
    const { counts, store, limits, now } = this.#deps;
    const at = now();
    const current = usagePeriod(at);
    const previous = previousUsagePeriod(current);
    const rows = await counts.count(previous, current);
    await store.save(rows, at.toISOString());
    const older = await store.history([previousUsagePeriod(previous)]);
    const grouped = byBusiness([...older, ...rows]);
    const ids = [...new Set(rows.map((r) => r.businessId))];
    const limitsBy = await limits.limitsOf(ids);
    let notices = 0;
    const failures: { businessId: string; error: string }[] = [];
    for (const id of ids) {
      const plan = limitsBy.get(id);
      if (plan === undefined) continue;
      try {
        notices += await notifyBusiness(this.#deps, id, current, grouped.get(id) ?? [], plan);
      } catch (error) {
        failures.push({
          businessId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { current, previous, businesses: ids.length, notices, failures };
  }
}
