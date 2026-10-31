/**
 * The ports of cancelling a subscription (LFPC art. 76 Bis): the acuse the
 * owner keeps, the confirmation they are told, and the one-click links the
 * renewal reminders carry. The portal implements them over `xangarro_billing`
 * and the email sender; the tests use fakes.
 */

import type { BillingInterval, PaidPlanId } from './plans.js';

/** Where the owner cancelled: Plan y pagos, or the link in a reminder. */
export type CancellationChannel = 'portal' | 'correo';

export interface CancellationAct {
  readonly businessId: string;
  readonly stripeSubscriptionId: string;
  readonly channel: CancellationChannel;
  /** When the plan ends: the end of the period already paid. */
  readonly endsAt: string;
  /** The portal user who tapped; `null` from an email link. */
  readonly requestedBy: string | null;
  readonly requestedAt: string;
}

export interface CancellationLedger {
  /** Append the act and return its folio, the owner's acuse («CX-7F3A21»). */
  record(act: CancellationAct): Promise<string>;
}

export interface CancellationNotice extends CancellationAct {
  readonly folio: string;
  readonly planId: PaidPlanId;
  readonly interval: BillingInterval;
}

/** Told once per cancellation: the confirmation email carries the folio. */
export interface CancellationListener {
  onCancelled(notice: CancellationNotice): Promise<void>;
}

export const noopCancellationListener: CancellationListener = {
  onCancelled: () => Promise.resolve(),
};

/** The renewal a reminder announced, as its link remembers it. */
export interface RenewalNoticeKey {
  readonly businessId: string;
  readonly stripeSubscriptionId: string;
  /** The charge the email announced; the link stops working at it. */
  readonly periodEnd: string;
}

export interface RenewalNotice extends RenewalNoticeKey {
  readonly usedAt: string | null;
}

/**
 * One reminder per renewal, and the single-use link inside it. Only a hash of
 * the token is stored, so a copy of the table cancels nothing.
 */
export interface RenewalNoticeStore {
  /**
   * A fresh link for this renewal, replacing one whose email never went out;
   * `null` when this renewal's reminder was already sent.
   */
  claim(key: RenewalNoticeKey): Promise<string | null>;
  markSent(key: RenewalNoticeKey): Promise<void>;
  find(token: string): Promise<RenewalNotice | null>;
  markUsed(token: string): Promise<void>;
}
