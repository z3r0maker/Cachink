/**
 * What the usage recompute (N-02 / N-03) needs from the outside world.
 * The portal implements them over `@xangarro/data-pg` (the
 * `xangarro_metering` connection), the admin inbox and — once B-14 lands —
 * the transactional email; tests use fakes.
 */

import type {
  ThresholdCrossing,
  UsageLimits,
  UsagePeriod,
  UsageSnapshot,
} from '@xangarro/domain/usage';

/** `xangarro.usage_counts()`: every live business, `first`..`last`, zeros included. */
export interface UsageCountSource {
  count(first: UsagePeriod, last: UsagePeriod): Promise<UsageSnapshot[]>;
}

/** `usage_counters`. */
export interface UsageCounterStore {
  save(rows: readonly UsageSnapshot[], computedAt: string): Promise<void>;
  /** Stored rows of the given months, every business. */
  history(periods: readonly UsagePeriod[]): Promise<UsageSnapshot[]>;
}

/** Each business's limits today (C-12 pending: `usageLimitsOf` over its plan). */
export interface UsageLimitsSource {
  limitsOf(businessIds: readonly string[]): Promise<ReadonlyMap<string, UsageLimits>>;
}

export type NoticeRecipient = 'owner' | 'provider';

/**
 * `usage_notices`: a notice is claimed before it is sent and finished after,
 * so it is sent once — and a crash in between retries it on the next run.
 */
export interface UsageNoticeLedger {
  begin(
    key: string,
    recipient: NoticeRecipient,
    businessId: string,
  ): Promise<'new' | 'retry' | 'done'>;
  finish(key: string, recipient: NoticeRecipient): Promise<void>;
}

/** A threshold the owner is told about (80 % / 100 %). */
export interface UsageThresholdNotice {
  readonly crossing: ThresholdCrossing;
  readonly value: number;
  readonly limit: number;
}

/**
 * The owner's warning (N-03): an email once B-14's mailer lands
 * (`track-n/b14-email`); until then `logUsageThresholdNotifier`. Swap the
 * adapter in the portal's composition root — nothing else changes.
 */
export interface UsageThresholdNotifier {
  notifyUsageThreshold(notice: UsageThresholdNotice): Promise<void>;
}

/** One structured log line per notice — ids and numbers, no PII. */
export function logUsageThresholdNotifier(log: (line: string) => void): UsageThresholdNotifier {
  return {
    notifyUsageThreshold({ crossing, value, limit }) {
      log(
        JSON.stringify({
          evt: 'usage_threshold',
          business_id: crossing.businessId,
          period: crossing.period,
          metric: crossing.metric,
          threshold: crossing.threshold,
          value,
          limit,
          key: crossing.idempotencyKey,
        }),
      );
      return Promise.resolve();
    },
  };
}
