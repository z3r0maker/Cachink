/**
 * Usage metering reads and writes (N-02 / N-03).
 *
 * Run on the `xangarro_metering` connection (`0009_metering_cfdi_grants.sql`,
 * `0010_usage_counts.sql`): the nightly recompute has no tenant claim and
 * reads every tenant's counted columns — and nothing else. Nothing here
 * deletes.
 */

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { usageCounters, usageNotices, type USAGE_RECIPIENTS } from '../schema/metering.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export type UsageRecipientName = (typeof USAGE_RECIPIENTS)[number];

/** One business in one month, as `xangarro.usage_counts()` counts it. */
export interface UsageCountRow {
  readonly businessId: string;
  readonly period: string;
  readonly transactions: number;
  readonly activeProducts: number;
}

interface RawCount extends Record<string, unknown> {
  business_id: string;
  period: string;
  transactions: number;
  active_products: number;
}

/**
 * The single counting query (OQ-5). `businessIds = null` counts every live
 * business; one row per business per month from `first` to `last`, zeros
 * included, ordered by business then month.
 */
export async function usageCounts(
  db: Conn,
  businessIds: readonly string[] | null,
  first: string,
  last: string,
): Promise<UsageCountRow[]> {
  // A JSON array, not a driver array: one text parameter, however many ids.
  const ids =
    businessIds === null
      ? sql`NULL::text[]`
      : sql`ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(businessIds)}::jsonb))`;
  const rows = await db.execute<RawCount>(sql`
    SELECT * FROM xangarro.usage_counts(${ids}, ${first}, ${last})`);
  return rows.map((r) => ({
    businessId: r.business_id,
    period: r.period,
    transactions: Number(r.transactions),
    activeProducts: Number(r.active_products),
  }));
}

/** Insert or overwrite each `(business, period)` counter. */
export async function saveUsageCounters(
  db: Conn,
  rows: readonly UsageCountRow[],
  computedAt: string,
): Promise<void> {
  if (rows.length === 0) return;
  await db
    .insert(usageCounters)
    .values(
      rows.map((r) => ({
        businessId: r.businessId,
        period: r.period,
        transactions: r.transactions,
        products: r.activeProducts,
        computedAt,
      })),
    )
    .onConflictDoUpdate({
      target: [usageCounters.businessId, usageCounters.period],
      set: {
        transactions: sql`excluded.transactions`,
        products: sql`excluded.products`,
        computedAt: sql`excluded.computed_at`,
      },
    });
}

/** Stored counters for the given months (every business). */
export async function usageCountersOf(
  db: Conn,
  periods: readonly string[],
): Promise<UsageCountRow[]> {
  if (periods.length === 0) return [];
  const rows = await db
    .select()
    .from(usageCounters)
    .where(inArray(usageCounters.period, [...periods]));
  return rows.map((r) => ({
    businessId: r.businessId,
    period: r.period,
    transactions: r.transactions,
    activeProducts: r.products,
  }));
}

/** One business's stored counter for a month, with when it was computed. */
export async function usageCounterOf(
  db: Conn,
  businessId: string,
  period: string,
): Promise<(UsageCountRow & { readonly computedAt: string }) | null> {
  const [r] = await db
    .select()
    .from(usageCounters)
    .where(and(eq(usageCounters.businessId, businessId), eq(usageCounters.period, period)));
  if (!r) return null;
  return {
    businessId: r.businessId,
    period: r.period,
    transactions: r.transactions,
    activeProducts: r.products,
    computedAt: new Date(r.computedAt).toISOString(),
  };
}

/**
 * Claim a notice. `new` — first time, send it; `retry` — claimed before but
 * never delivered, send it again; `done` — delivered, send nothing.
 */
export async function beginUsageNotice(
  db: Conn,
  key: string,
  recipient: UsageRecipientName,
  businessId: string,
): Promise<'new' | 'retry' | 'done'> {
  const inserted = await db
    .insert(usageNotices)
    .values({ idempotencyKey: key, recipient, businessId })
    .onConflictDoNothing()
    .returning({ key: usageNotices.idempotencyKey });
  if (inserted.length > 0) return 'new';
  const [row] = await db
    .select({ deliveredAt: usageNotices.deliveredAt })
    .from(usageNotices)
    .where(and(eq(usageNotices.idempotencyKey, key), eq(usageNotices.recipient, recipient)));
  return row?.deliveredAt ? 'done' : 'retry';
}

/** Mark a claimed notice delivered. */
export async function finishUsageNotice(
  db: Conn,
  key: string,
  recipient: UsageRecipientName,
): Promise<void> {
  await db
    .update(usageNotices)
    .set({ deliveredAt: sql`now()` })
    .where(
      and(
        eq(usageNotices.idempotencyKey, key),
        eq(usageNotices.recipient, recipient),
        isNull(usageNotices.deliveredAt),
      ),
    );
}

/**
 * The business owner's address (`xangarro.owner_email`, 0011) — the recipient
 * of the usage emails. Null when the business has no owner with an account.
 */
export async function ownerEmailOf(db: Conn, businessId: string): Promise<string | null> {
  const rows = await db.execute<{ email: string | null }>(
    sql`SELECT xangarro.owner_email(${businessId}) AS email`,
  );
  return rows[0]?.email ?? null;
}

/**
 * Every live business, oldest id first — the cross-tenant enumeration a
 * scheduled fan-out needs (P-30, ADR-056 «a daily job selects the businesses
 * that are due»).
 *
 * **No migration and no new role.** 0010 already grants the metering role
 * `SELECT (id, deleted_at) ON public.businesses` beside a `metering_read`
 * policy, because `usage_counts(NULL, …)` enumerates the same set to count it.
 * This reads those two columns and nothing else, so the privilege surface a
 * fan-out adds is zero.
 *
 * A soft-deleted business is not live: it is excluded here exactly as
 * `usage_counts` excludes it, so the two never disagree about who exists.
 */
export async function liveBusinessIds(db: Conn): Promise<string[]> {
  const rows = await db.execute<{ id: string }>(sql`
    SELECT b.id FROM public.businesses b WHERE b.deleted_at IS NULL ORDER BY b.id`);
  return rows.map((r) => r.id);
}
