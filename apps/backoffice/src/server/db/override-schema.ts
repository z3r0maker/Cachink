/**
 * `plan_overrides` (N-06) and the one `auth.users` shape the tenant pages
 * read. Same temporary home as `./schema.ts`; the SQL, with its CHECKs,
 * grants and RLS, is `./migrations/0003_plan_overrides.sql` (and 0004 for the
 * read grants).
 *
 * `mode: 'date'` as in `./support-schema.ts`: these rows are read back, and
 * postgres.js renders a timestamptz string in a non-ISO form.
 */
import { index, integer, pgSchema, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { staffMembers } from './schema';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const planOverrides = pgTable(
  'plan_overrides',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    kind: text('kind').notNull(),
    days: integer('days'),
    planId: text('plan_id'),
    reason: text('reason'),
    expiresAt: instant('expires_at'),
    createdBy: text('created_by')
      .notNull()
      .references(() => staffMembers.id),
    createdAt: instant('created_at').notNull(),
  },
  (t) => [index('plan_overrides_business_created_idx').on(t.businessId, t.createdAt.desc())],
);

export type PlanOverrideRow = typeof planOverrides.$inferSelect;

/** Supabase's identity table: the console may read `id` and `email`, nothing else. */
export const authUsers = pgSchema('auth').table('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
});
