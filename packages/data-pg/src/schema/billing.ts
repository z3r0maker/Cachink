/**
 * Billing tables (B-10, N-01). Portal-only: none of these cross the wire.
 *
 * **Stripe is the source of truth** (ADR-063); these rows are what its
 * webhooks last told us, kept so the entitlement can be computed without a
 * network call on every pull. The tenant may read its own rows; only the
 * `xangarro_billing` role writes them, and nobody deletes them
 * (`0007_billing_grants.sql`).
 *
 * `subscriptions` is keyed by the Stripe subscription, not the business: a
 * business that moves from a card trial to an annual SPEI subscription has two
 * rows for a while, and events for either may arrive in any order. The
 * current one is chosen when read (`currentSubscription`).
 */

import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const BILLING_PLAN_IDS = ['xangarro', 'xangarrote'] as const;
export const BILLING_INTERVALS = ['month', 'year'] as const;
/** What the webhook maps Stripe's status to — `SubscriptionStatus` minus `grace`/`free`. */
export const BILLING_STATUSES = ['trialing', 'active', 'past_due', 'lapsed'] as const;
export const COLLECTION_METHODS = ['charge_automatically', 'send_invoice'] as const;

/** One Stripe customer per business. */
export const billingCustomers = pgTable(
  'billing_customers',
  {
    businessId: text('business_id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id').notNull().unique(),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (t) => [index('billing_customers_business_idx').on(t.businessId)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    stripeSubscriptionId: text('stripe_subscription_id').primaryKey(),
    businessId: text('business_id').notNull(),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    planId: text('plan_id', { enum: BILLING_PLAN_IDS }).notNull(),
    interval: text('interval', { enum: BILLING_INTERVALS }).notNull(),
    status: text('status', { enum: BILLING_STATUSES }).notNull(),
    /** Stripe's own word (`incomplete`, `unpaid`, …), for support; rules read `status`. */
    stripeStatus: text('stripe_status').notNull(),
    trialEnd: at('trial_end'),
    currentPeriodStart: at('current_period_start'),
    currentPeriodEnd: at('current_period_end'),
    cancelAt: at('cancel_at'),
    collectionMethod: text('collection_method', { enum: COLLECTION_METHODS }).notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (t) => [index('subscriptions_business_idx').on(t.businessId, t.updatedAt)],
);

/** Every webhook event once: the idempotency ledger and the error record. */
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  receivedAt: at('received_at').notNull().defaultNow(),
  processedAt: at('processed_at'),
  /** Why it failed (retried) or was ignored (processed); never PII. */
  error: text('error'),
});
