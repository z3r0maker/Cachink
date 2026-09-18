/**
 * `platform_flag_events` and its `platform_flags` view (N-09). Same temporary
 * home as `./schema.ts`; the SQL, with its CHECKs, grants and the portal's
 * narrow view, is `./migrations/0005_platform_flags.sql`.
 *
 * The view is declared `.existing()`: Drizzle reads it, the SQL owns it.
 */
import { index, pgTable, pgView, text, timestamp } from 'drizzle-orm/pg-core';

import { staffMembers } from './schema';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

const columns = {
  flagKey: text('flag_key').notNull(),
  mode: text('mode').notNull(),
  allowlistBusinessIds: text('allowlist_business_ids').array().notNull(),
  reason: text('reason').notNull(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: instant('updated_at').notNull(),
};

/** Append-only: the migration grants the console SELECT and INSERT, nothing else. */
export const platformFlagEvents = pgTable(
  'platform_flag_events',
  {
    id: text('id').primaryKey(),
    ...columns,
    updatedBy: text('updated_by')
      .notNull()
      .references(() => staffMembers.id),
  },
  (t) => [index('platform_flag_events_key_at_idx').on(t.flagKey, t.updatedAt.desc(), t.id.desc())],
);

export type PlatformFlagEventRow = typeof platformFlagEvents.$inferSelect;

/** Latest event per key. */
export const platformFlags = pgView('platform_flags', columns).existing();
