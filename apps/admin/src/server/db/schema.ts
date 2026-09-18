/**
 * Staff tables — portal-only entities (ADR-060) read and written only by
 * `apps/admin` (ADR-063).
 *
 * **Temporary home.** ADR-060 puts portal-only pg-core tables in
 * `@xangarro/data-pg`. They live here, with their SQL in
 * `./migrations/0001_staff.sql`, only because that package had in-flight
 * edits on another branch when N-05 landed; moving both files there (and
 * adding the migration to `db-local.sh`'s apply order) is a mechanical
 * follow-up with no schema change.
 *
 * Neither table has a `business_id` tenant column: staff are not tenants, and
 * `staff_audit_log.business_id` only records which tenant an action touched.
 */

import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

/** The allowlist. A live row (`revoked_at IS NULL`) is what makes a user staff. */
export const staffMembers = pgTable('staff_members', {
  id: text('id').primaryKey(),
  /** `auth.users.id` — uuid, a different id space from our ULIDs. */
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  nombre: text('nombre').notNull(),
  createdAt: instant('created_at').notNull(),
  revokedAt: instant('revoked_at'),
});

/** Append-only: the migration grants INSERT and SELECT, never UPDATE or DELETE. */
export const staffAuditLog = pgTable(
  'staff_audit_log',
  {
    id: text('id').primaryKey(),
    staffId: text('staff_id')
      .notNull()
      .references(() => staffMembers.id),
    action: text('action').notNull(),
    businessId: text('business_id'),
    payload: jsonb('payload').notNull(),
    at: instant('at').notNull(),
  },
  (t) => [
    index('staff_audit_log_at_idx').on(t.at),
    index('staff_audit_log_business_at_idx').on(t.businessId, t.at),
  ],
);
