import { customType, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * `business_logos` — portal-only (0023): the uploaded logo bytes behind
 * `businesses.logo_url`. Never synced; the devices pull the stable URL the
 * portal route serves. Supabase Storage was ruled out at the N-19 interview
 * (its REST upload needs a Supabase JWT the in-house auth never mints).
 */

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const businessLogos = pgTable('business_logos', {
  businessId: text('business_id').primaryKey(),
  mime: text('mime').notNull(),
  bytes: bytea('bytes').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
