/**
 * In-memory fakes for the usage recompute's ports.
 */

import type { UsageLimits, UsagePeriod, UsageSnapshot } from '@xangarro/domain/usage';

import type {
  NoticeRecipient,
  UsageCountSource,
  UsageCounterStore,
  UsageLimitsSource,
  UsageNoticeLedger,
  UsageThresholdNotice,
  UsageThresholdNotifier,
} from '../../src/usage/index.js';

export class FakeCounts implements UsageCountSource {
  rows: UsageSnapshot[] = [];
  fail: Error | null = null;

  count(first: UsagePeriod, last: UsagePeriod): Promise<UsageSnapshot[]> {
    if (this.fail) return Promise.reject(this.fail);
    return Promise.resolve(this.rows.filter((r) => r.period >= first && r.period <= last));
  }
}

export class MemoryCounters implements UsageCounterStore {
  readonly rows = new Map<string, UsageSnapshot>();

  save(rows: readonly UsageSnapshot[]): Promise<void> {
    for (const r of rows) this.rows.set(`${r.businessId}:${r.period}`, r);
    return Promise.resolve();
  }

  history(periods: readonly UsagePeriod[]): Promise<UsageSnapshot[]> {
    return Promise.resolve([...this.rows.values()].filter((r) => periods.includes(r.period)));
  }
}

export class FixedLimits implements UsageLimitsSource {
  constructor(readonly byBusiness: Record<string, UsageLimits>) {}

  limitsOf(ids: readonly string[]): Promise<ReadonlyMap<string, UsageLimits>> {
    const unlimited = { transactionsPerMonth: null, activeProducts: null };
    return Promise.resolve(new Map(ids.map((id) => [id, this.byBusiness[id] ?? unlimited])));
  }
}

export class MemoryLedger implements UsageNoticeLedger {
  readonly delivered = new Set<string>();
  readonly claimed = new Set<string>();

  begin(key: string, recipient: NoticeRecipient): Promise<'new' | 'retry' | 'done'> {
    const k = `${key}|${recipient}`;
    if (this.delivered.has(k)) return Promise.resolve('done');
    if (this.claimed.has(k)) return Promise.resolve('retry');
    this.claimed.add(k);
    return Promise.resolve('new');
  }

  finish(key: string, recipient: NoticeRecipient): Promise<void> {
    this.delivered.add(`${key}|${recipient}`);
    return Promise.resolve();
  }
}

export class RecordingOwner implements UsageThresholdNotifier {
  readonly sent: UsageThresholdNotice[] = [];
  failFor: string | null = null;

  notifyUsageThreshold(notice: UsageThresholdNotice): Promise<void> {
    if (notice.crossing.businessId === this.failFor) return Promise.reject(new Error('smtp'));
    this.sent.push(notice);
    return Promise.resolve();
  }
}

export const snap = (
  businessId: string,
  period: UsagePeriod,
  transactions: number,
  activeProducts = 0,
): UsageSnapshot => ({ businessId, period, transactions, activeProducts });
