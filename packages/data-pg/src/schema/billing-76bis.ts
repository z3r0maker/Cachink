/**
 * Cancelling and renewing under LFPC art. 76 Bis (ADR-132,
 * `0049_billing_cancel_76bis.sql`). Portal-only; written by `xangarro_billing`
 * alone, read by no tenant, deleted by nobody.
 */

import { char, index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const CANCELLATION_CHANNELS = ['portal', 'correo'] as const;

/** One reminder per renewal, and the hash of its single-use cancel link. */
export const billingRenewalNotices = pgTable(
  'billing_renewal_notices',
  {
    stripeSubscriptionId: text('stripe_subscription_id').notNull(),
    /** The charge the email announced; the link stops working at it. */
    periodEnd: at('period_end').notNull(),
    businessId: text('business_id').notNull(),
    tokenHash: char('token_hash', { length: 64 }).notNull().unique(),
    createdAt: at('created_at').notNull().defaultNow(),
    sentAt: at('sent_at'),
    usedAt: at('used_at'),
  },
  (t) => [
    primaryKey({ columns: [t.stripeSubscriptionId, t.periodEnd] }),
    index('billing_renewal_notices_business_idx').on(t.businessId, t.periodEnd),
  ],
);

/** The acuse: one append-only row per cancellation. */
export const billingCancellations = pgTable(
  'billing_cancellations',
  {
    /** «CX-7F3A21», what the confirmation email shows. */
    folio: text('folio').primaryKey(),
    businessId: text('business_id').notNull(),
    stripeSubscriptionId: text('stripe_subscription_id').notNull(),
    channel: text('channel', { enum: CANCELLATION_CHANNELS }).notNull(),
    endsAt: at('ends_at').notNull(),
    requestedBy: uuid('requested_by'),
    requestedAt: at('requested_at').notNull(),
  },
  (t) => [index('billing_cancellations_business_idx').on(t.businessId, t.requestedAt)],
);

/** The Términos box ticked inside Stripe Checkout, copied from the webhook. */
export const billingConsents = pgTable(
  'billing_consents',
  {
    checkoutSessionId: text('checkout_session_id').primaryKey(),
    businessId: text('business_id').notNull(),
    stripeSubscriptionId: text('stripe_subscription_id'),
    termsVersion: text('terms_version').notNull(),
    acceptedAt: at('accepted_at').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (t) => [index('billing_consents_business_idx').on(t.businessId, t.acceptedAt)],
);
