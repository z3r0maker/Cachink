/**
 * Which renewals get their reminder today (LFPC art. 76 Bis). Pure.
 *
 * Every renewal is announced, monthly included, at least five días hábiles
 * before the charge. The cron runs daily and a renewal qualifies from the
 * sixth día hábil before it: five clear días hábiles, plus a day's margin for
 * a run that fails. A renewal first seen inside that window (a late webhook)
 * still gets its reminder, late rather than never.
 *
 * Only a subscription that will renew qualifies: `active` and not cancelled.
 * A SPEI year is announced too; its reminder speaks of the invoice, not a
 * charge to a card.
 */
import { restarDiasHabiles, type IsoDate } from '@xangarro/domain';

import { totalCentavos, type BillingInterval, type PaidPlanId } from '../billing/plans.js';
import type { SubscriptionRecord } from '../billing/ports.js';
import { mxDate } from './trial-selection.js';

export const RENEWAL_NOTICE_DIAS_HABILES = 6;

export type RenewalReminderKind = 'card' | 'spei';

export interface RenewalReminder {
  readonly kind: RenewalReminderKind;
  readonly businessId: string;
  readonly stripeSubscriptionId: string;
  readonly stripeCustomerId: string;
  readonly planId: PaidPlanId;
  readonly interval: BillingInterval;
  /** The charge (or the SPEI invoice) being announced: the current period's end. */
  readonly chargeAt: string;
  /** What will be charged, IVA included, in centavos. */
  readonly totalCentavos: number;
}

const DAY = 86_400_000;

/**
 * The `current_period_end` range the query must cover. Six días hábiles never
 * span more than 14 calendar days (a weekend and two rest days); 21 is slack.
 */
export function renewalReminderWindow(now: Date): { from: string; to: string } {
  return { from: now.toISOString(), to: new Date(now.getTime() + 21 * DAY).toISOString() };
}

function due(
  row: SubscriptionRecord,
  now: Date,
): row is SubscriptionRecord & {
  currentPeriodEnd: string;
} {
  if (row.status !== 'active' || row.cancelAt !== null || row.currentPeriodEnd === null) {
    return false;
  }
  if (Date.parse(row.currentPeriodEnd) <= now.getTime()) return false;
  const opens = restarDiasHabiles(
    mxDate(row.currentPeriodEnd) as IsoDate,
    RENEWAL_NOTICE_DIAS_HABILES,
  );
  return mxDate(now.toISOString()) >= opens;
}

export function selectRenewalReminders(
  rows: readonly SubscriptionRecord[],
  now: Date,
): RenewalReminder[] {
  return rows
    .filter((row) => due(row, now))
    .map((row) => ({
      kind: row.collectionMethod === 'send_invoice' ? 'spei' : 'card',
      businessId: row.businessId,
      stripeSubscriptionId: row.stripeSubscriptionId,
      stripeCustomerId: row.stripeCustomerId,
      planId: row.planId,
      interval: row.interval,
      chargeAt: row.currentPeriodEnd as string,
      totalCentavos: totalCentavos(row.planId, row.interval),
    }));
}
