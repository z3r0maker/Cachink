/**
 * Which trials get an email today (N-01, B-14). Pure.
 *
 * The daily cron looks at two windows, each 24 h wide so consecutive runs
 * never overlap: a trial whose end is 48–72 h away gets «termina en 3 días»
 * (day 11 of 14), and one that ended in the last 24 h without converting gets
 * «terminó» (day 14: the business is on xangarrito now). A business with any
 * other subscription that is `active` is paying already and gets neither.
 */
import type { SubscriptionRecord } from '../billing/ports.js';

export const TRIAL_REMINDER_KINDS = ['trial-ending', 'trial-ended'] as const;
export type TrialReminderKind = (typeof TRIAL_REMINDER_KINDS)[number];

export interface TrialReminder {
  readonly kind: TrialReminderKind;
  readonly businessId: string;
  readonly stripeCustomerId: string;
  readonly planId: SubscriptionRecord['planId'];
  readonly trialEnd: string;
  /** `kind:business:YYYY-MM-DD` (the trial's end date in Mexico City). */
  readonly idempotencyKey: string;
}

const H = 3_600_000;

/** The `trial_end` range the query must cover: (now − 24 h, now + 72 h]. */
export function trialReminderWindow(now: Date): { from: string; to: string } {
  return {
    from: new Date(now.getTime() - 24 * H).toISOString(),
    to: new Date(now.getTime() + 72 * H).toISOString(),
  };
}

const MX_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `YYYY-MM-DD` in Mexico City. */
export function mxDate(iso: string): string {
  return MX_DATE.format(new Date(iso));
}

function kindOf(row: SubscriptionRecord, now: number): TrialReminderKind | null {
  if (row.trialEnd === null) return null;
  const left = Date.parse(row.trialEnd) - now;
  if (row.status === 'trialing' && left > 48 * H && left <= 72 * H) return 'trial-ending';
  const unpaid = row.status === 'lapsed' || row.status === 'past_due';
  if (unpaid && left <= 0 && left > -24 * H) return 'trial-ended';
  return null;
}

export function selectTrialReminders(
  rows: readonly SubscriptionRecord[],
  now: Date,
): TrialReminder[] {
  const paying = new Set(rows.filter((r) => r.status === 'active').map((r) => r.businessId));
  const out = new Map<string, TrialReminder>();
  for (const row of rows) {
    const kind = kindOf(row, now.getTime());
    if (kind === null || row.trialEnd === null || paying.has(row.businessId)) continue;
    const idempotencyKey = `${kind}:${row.businessId}:${mxDate(row.trialEnd)}`;
    out.set(idempotencyKey, {
      kind,
      businessId: row.businessId,
      stripeCustomerId: row.stripeCustomerId,
      planId: row.planId,
      trialEnd: row.trialEnd,
      idempotencyKey,
    });
  }
  return [...out.values()];
}
