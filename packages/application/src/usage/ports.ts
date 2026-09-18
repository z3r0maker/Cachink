/**
 * What the usage recompute (N-02 / N-03) needs from the outside world.
 * The portal implements them over `@xangarro/data-pg` (the
 * `xangarro_metering` connection), the admin inbox and B-14's transactional
 * email; tests use fakes.
 */

import type { UsageLimits, UsagePeriod, UsageSnapshot } from '@xangarro/domain/usage';

import type { UsageThresholdNotice } from '../email/notify-usage-threshold.js';

export type { UsageThresholdNotice };

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

/**
 * The owner's 80 % / 100 % warning (N-03). The portal implements it with
 * B-14's `notifyUsageThreshold` email (`@xangarro/application/email`),
 * addressed to the owner from `xangarro.owner_email()`. It must throw when the
 * email was not sent, so the ledger retries it on the next run.
 */
export interface UsageThresholdNotifier {
  notifyUsageThreshold(notice: UsageThresholdNotice): Promise<void>;
}
