/**
 * Usage metering tables (N-02 / N-03, ADR-065). Portal-only: none of these
 * cross the wire (ADR-060).
 *
 * `usage_counters` is a cache of what `xangarro.usage_counts()` last said for
 * a business and a business-local month; the nightly recompute rewrites it
 * from source rows, so it can never drift for more than a day.
 *
 * `usage_notices` is the idempotency ledger of N-03's threshold notices: one
 * row per `(business:period:metric:threshold, recipient)`, claimed before the
 * notice is sent and stamped `delivered_at` after, so a crash between the two
 * retries on the next run and a delivered notice is never sent twice.
 *
 * Only the `xangarro_metering` role reads or writes them; nobody deletes
 * (`0009_metering_cfdi_grants.sql`).
 */

import { index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const USAGE_RECIPIENTS = ['owner', 'provider'] as const;

export const usageCounters = pgTable(
  'usage_counters',
  {
    businessId: text('business_id').notNull(),
    /** `'YYYY-MM'`, America/Mexico_City. */
    period: text('period').notNull(),
    transactions: integer('transactions').notNull(),
    products: integer('products').notNull(),
    computedAt: at('computed_at').notNull().defaultNow(),
  },
  (t) => [
    index('usage_counters_business_idx').on(t.businessId),
    primaryKey({ columns: [t.businessId, t.period] }),
  ],
);

export const usageNotices = pgTable(
  'usage_notices',
  {
    /** `business:period:metric:threshold`, or `business:period:upgrade`. */
    idempotencyKey: text('idempotency_key').notNull(),
    recipient: text('recipient', { enum: USAGE_RECIPIENTS }).notNull(),
    businessId: text('business_id').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
    deliveredAt: at('delivered_at'),
  },
  (t) => [
    index('usage_notices_business_idx').on(t.businessId),
    primaryKey({ columns: [t.idempotencyKey, t.recipient] }),
  ],
);
