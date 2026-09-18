/**
 * `SendTrialRemindersUseCase` — the daily trial emails (N-01 day 11 and 14).
 *
 * Idempotent per `(business, kind, trial end date)`: the windows do not
 * overlap between daily runs, and each message carries that key, so a cron
 * retried within the day is answered by the provider with the first email.
 * One business failing (no recipient, provider refusal) never stops the rest.
 */
import type { SubscriptionRecord } from '../billing/ports.js';
import type { EmailContent, EmailSender } from './message.js';
import {
  selectTrialReminders,
  trialReminderWindow,
  type TrialReminder,
} from './trial-selection.js';

export interface EmailRecipient {
  readonly email: string;
  /** Business or owner name for the greeting, when known. */
  readonly name: string | null;
}

export interface TrialSubscriptionSource {
  /** Every subscription whose `trial_end` is in `(from, to]`. */
  between(from: string, to: string): Promise<readonly SubscriptionRecord[]>;
  /** Every subscription of these businesses (to see who is paying already). */
  ofBusinesses(businessIds: readonly string[]): Promise<readonly SubscriptionRecord[]>;
}

export interface CustomerRecipients {
  /** The billing contact of a Stripe customer, or `null` when it has none. */
  of(stripeCustomerId: string): Promise<EmailRecipient | null>;
}

export interface SendTrialRemindersDeps {
  readonly trials: TrialSubscriptionSource;
  readonly recipients: CustomerRecipients;
  readonly compose: (reminder: TrialReminder, to: EmailRecipient) => EmailContent;
  readonly sender: EmailSender;
  readonly report: (error: unknown, businessId: string) => void;
}

export interface TrialRemindersOutcome {
  readonly sent: number;
  readonly skipped: number;
  readonly failed: number;
}

type One = keyof TrialRemindersOutcome;

export class SendTrialRemindersUseCase {
  constructor(readonly deps: SendTrialRemindersDeps) {}

  async execute(now: Date): Promise<TrialRemindersOutcome> {
    const { from, to } = trialReminderWindow(now);
    const windowed = await this.deps.trials.between(from, to);
    const ids = [...new Set(windowed.map((r) => r.businessId))];
    const rows = ids.length === 0 ? [] : await this.deps.trials.ofBusinesses(ids);
    const tally = { sent: 0, skipped: 0, failed: 0 };
    for (const reminder of selectTrialReminders(rows, now)) {
      tally[await this.one(reminder)] += 1;
    }
    return tally;
  }

  private async one(reminder: TrialReminder): Promise<One> {
    try {
      const to = await this.deps.recipients.of(reminder.stripeCustomerId);
      if (to === null) return 'skipped';
      const result = await this.deps.sender.send({
        ...this.deps.compose(reminder, to),
        to: to.email,
        tags: [
          { name: 'kind', value: reminder.kind },
          { name: 'business', value: reminder.businessId },
        ],
        idempotencyKey: reminder.idempotencyKey,
      });
      if (result.ok) return 'sent';
      this.deps.report(result.error, reminder.businessId);
    } catch (error) {
      this.deps.report(error, reminder.businessId);
    }
    return 'failed';
  }
}
