/**
 * Billing reads and writes (B-10).
 *
 * Writes run on the `xangarro_billing` connection — the webhook has no tenant
 * claim, and `0007_billing_grants.sql` lets only that role write. Reads work
 * on either: the billing role sees every row, a tenant transaction sees its
 * own. Nothing here deletes.
 *
 * Timestamps come back as ISO-8601 (`2026-09-17T12:00:00.000Z`), not
 * Postgres's `2026-09-17 12:00:00+00`, so they compare as strings.
 */

import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { billingCustomers, stripeEvents, subscriptions } from '../schema/billing.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export type SubscriptionRow = Omit<typeof subscriptions.$inferSelect, 'createdAt' | 'updatedAt'>;

const iso = (v: string | null): string | null => (v === null ? null : new Date(v).toISOString());

function toRow(r: typeof subscriptions.$inferSelect): SubscriptionRow {
  return {
    stripeSubscriptionId: r.stripeSubscriptionId,
    businessId: r.businessId,
    stripeCustomerId: r.stripeCustomerId,
    planId: r.planId,
    interval: r.interval,
    status: r.status,
    stripeStatus: r.stripeStatus,
    trialEnd: iso(r.trialEnd),
    currentPeriodStart: iso(r.currentPeriodStart),
    currentPeriodEnd: iso(r.currentPeriodEnd),
    cancelAt: iso(r.cancelAt),
    collectionMethod: r.collectionMethod,
  };
}

export async function billingCustomerOf(db: Conn, businessId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: billingCustomers.stripeCustomerId })
    .from(billingCustomers)
    .where(eq(billingCustomers.businessId, businessId));
  return row?.id ?? null;
}

export async function businessOfBillingCustomer(
  db: Conn,
  stripeCustomerId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: billingCustomers.businessId })
    .from(billingCustomers)
    .where(eq(billingCustomers.stripeCustomerId, stripeCustomerId));
  return row?.id ?? null;
}

/** First writer wins: a business keeps the customer it was given. */
export async function saveBillingCustomer(
  db: Conn,
  businessId: string,
  stripeCustomerId: string,
): Promise<void> {
  await db.insert(billingCustomers).values({ businessId, stripeCustomerId }).onConflictDoNothing();
}

/** Every subscription the business has had, newest first. */
export async function subscriptionsOfBusiness(
  db: Conn,
  businessId: string,
): Promise<SubscriptionRow[]> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, businessId))
    .orderBy(desc(subscriptions.updatedAt));
  return rows.map(toRow);
}

/** Rows for many businesses at once — the admin's `BillingStatusSource` adapter. */
export async function subscriptionsOfBusinesses(
  db: Conn,
  businessIds: readonly string[],
): Promise<SubscriptionRow[]> {
  if (businessIds.length === 0) return [];
  const rows = await db
    .select()
    .from(subscriptions)
    .where(inArray(subscriptions.businessId, [...businessIds]));
  return rows.map(toRow);
}

/** Insert, or replace every Stripe-owned column of, one subscription. */
export async function saveSubscriptionRow(db: Conn, row: SubscriptionRow): Promise<void> {
  const { stripeSubscriptionId: _key, ...rest } = row;
  await db
    .insert(subscriptions)
    .values(row)
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: { ...rest, updatedAt: sql`now()` },
    });
}

/**
 * Record an event (idempotency). `done` when it was already processed;
 * `retry` when it was recorded but never finished.
 */
export async function beginStripeEvent(
  db: Conn,
  id: string,
  type: string,
): Promise<'new' | 'retry' | 'done'> {
  const inserted = await db
    .insert(stripeEvents)
    .values({ id, type })
    .onConflictDoNothing()
    .returning({ id: stripeEvents.id });
  if (inserted.length > 0) return 'new';
  const [row] = await db
    .select({ processedAt: stripeEvents.processedAt })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, id));
  return row?.processedAt ? 'done' : 'retry';
}

export async function finishStripeEvent(db: Conn, id: string, note: string | null): Promise<void> {
  await db
    .update(stripeEvents)
    .set({ processedAt: sql`now()`, error: note })
    .where(and(eq(stripeEvents.id, id), isNull(stripeEvents.processedAt)));
}

export async function failStripeEvent(db: Conn, id: string, error: string): Promise<void> {
  await db
    .update(stripeEvents)
    .set({ error: error.slice(0, 500) })
    .where(eq(stripeEvents.id, id));
}
