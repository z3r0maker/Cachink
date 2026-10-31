/**
 * `SendRenewalRemindersUseCase` — the daily renewal reminders (LFPC art. 76
 * Bis). Each carries a single-use link that cancels in one tap.
 *
 * Once per renewal: the store claims the renewal before sending and marks it
 * sent after, so a cron retried within the day sends nothing twice. A claim
 * whose email never went out is claimed again with a new link; the message
 * key carries that link's prefix, so the provider never answers a retry with
 * an older email whose link no longer works. One business failing never stops
 * the rest.
 */
import type { RenewalNoticeStore } from '../billing/cancel-ports.js';
import type { SubscriptionRecord } from '../billing/ports.js';
import type { EmailContent, EmailSender } from './message.js';
import {
  renewalReminderWindow,
  selectRenewalReminders,
  type RenewalReminder,
} from './renewal-selection.js';
import type {
  CustomerRecipients,
  EmailRecipient,
  TrialRemindersOutcome,
} from './send-trial-reminders.js';
import { mxDate } from './trial-selection.js';

export interface RenewingSubscriptionSource {
  /** Every subscription whose `current_period_end` is in `(from, to]`. */
  renewingBetween(from: string, to: string): Promise<readonly SubscriptionRecord[]>;
}

export interface SendRenewalRemindersDeps {
  readonly source: RenewingSubscriptionSource;
  readonly notices: RenewalNoticeStore;
  readonly recipients: CustomerRecipients;
  readonly compose: (
    reminder: RenewalReminder,
    to: EmailRecipient,
    cancelToken: string,
  ) => EmailContent | Promise<EmailContent>;
  readonly sender: EmailSender;
  readonly report: (error: unknown, businessId: string) => void;
}

export type RenewalRemindersOutcome = TrialRemindersOutcome;
type One = keyof RenewalRemindersOutcome;

export class SendRenewalRemindersUseCase {
  constructor(readonly deps: SendRenewalRemindersDeps) {}

  async execute(now: Date): Promise<RenewalRemindersOutcome> {
    const { from, to } = renewalReminderWindow(now);
    const rows = await this.deps.source.renewingBetween(from, to);
    const tally = { sent: 0, skipped: 0, failed: 0 };
    for (const reminder of selectRenewalReminders(rows, now)) {
      tally[await this.one(reminder)] += 1;
    }
    return tally;
  }

  private async one(reminder: RenewalReminder): Promise<One> {
    const key = {
      businessId: reminder.businessId,
      stripeSubscriptionId: reminder.stripeSubscriptionId,
      periodEnd: reminder.chargeAt,
    };
    try {
      const to = await this.deps.recipients.of(reminder.stripeCustomerId);
      if (to === null) return 'skipped';
      const token = await this.deps.notices.claim(key);
      if (token === null) return 'skipped';
      const result = await this.deps.sender.send({
        ...(await this.deps.compose(reminder, to, token)),
        to: to.email,
        tags: [
          { name: 'kind', value: `renewal-${reminder.kind}` },
          { name: 'business', value: reminder.businessId },
        ],
        idempotencyKey: `renewal:${reminder.stripeSubscriptionId}:${mxDate(reminder.chargeAt)}:${token.slice(0, 8)}`,
      });
      if (result.ok) {
        await this.deps.notices.markSent(key);
        return 'sent';
      }
      this.deps.report(result.error, reminder.businessId);
    } catch (error) {
      this.deps.report(error, reminder.businessId);
    }
    return 'failed';
  }
}
