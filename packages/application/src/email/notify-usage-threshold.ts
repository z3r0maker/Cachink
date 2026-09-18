/**
 * `NotifyUsageThresholdUseCase` — the owner's 80 % / 100 % email (N-03).
 *
 * The caller is N-02's usage wiring: it detects crossings with the domain's
 * `crossedThresholds` and passes each one here with its counts. Once per
 * threshold per month is the crossing's job (a crossing fires once); the
 * idempotency key here only makes a retried call safe. 150 % is
 * provider-only (`THRESHOLD_RECIPIENTS`), so the owner gets nothing.
 */
import type { UsageMetric, UsageThreshold } from '@xangarro/domain/usage';

import type { EmailSendError } from './errors.js';
import type { EmailContent, EmailSender } from './message.js';
import type { EmailRecipient } from './send-trial-reminders.js';

export interface UsageThresholdNotice {
  readonly businessId: string;
  /** `YYYY-MM`. */
  readonly period: string;
  readonly metric: UsageMetric;
  readonly threshold: UsageThreshold;
  readonly used: number;
  readonly limit: number;
  /** The domain crossing's key, `business:period:metric:threshold`. */
  readonly idempotencyKey: string;
}

export interface OwnerRecipients {
  of(businessId: string): Promise<EmailRecipient | null>;
}

export interface NotifyUsageThresholdDeps {
  readonly owners: OwnerRecipients;
  readonly compose: (notice: UsageThresholdNotice, to: EmailRecipient) => EmailContent;
  readonly sender: EmailSender;
}

export type UsageNotifyOutcome =
  | { readonly status: 'sent'; readonly id: string }
  | { readonly status: 'skipped'; readonly reason: 'not_for_owner' | 'no_recipient' }
  | { readonly status: 'failed'; readonly error: EmailSendError };

const OWNER_THRESHOLDS: ReadonlySet<UsageThreshold> = new Set([80, 100]);

export class NotifyUsageThresholdUseCase {
  constructor(private readonly deps: NotifyUsageThresholdDeps) {}

  async execute(notice: UsageThresholdNotice): Promise<UsageNotifyOutcome> {
    if (!OWNER_THRESHOLDS.has(notice.threshold)) {
      return { status: 'skipped', reason: 'not_for_owner' };
    }
    const to = await this.deps.owners.of(notice.businessId);
    if (to === null) return { status: 'skipped', reason: 'no_recipient' };
    const result = await this.deps.sender.send({
      ...this.deps.compose(notice, to),
      to: to.email,
      tags: [
        { name: 'kind', value: 'usage-threshold' },
        { name: 'threshold', value: String(notice.threshold) },
      ],
      idempotencyKey: `usage-threshold:${notice.idempotencyKey}`,
    });
    return result.ok
      ? { status: 'sent', id: result.id }
      : { status: 'failed', error: result.error };
  }
}
