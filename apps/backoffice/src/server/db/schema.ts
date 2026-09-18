/**
 * Staff tables — portal-only entities (ADR-060) read and written only by
 * `apps/backoffice` (ADR-063).
 *
 * **Temporary home.** ADR-060 puts portal-only pg-core tables in
 * `@xangarro/data-pg`. They live here, with their SQL in
 * `./migrations/0001_staff.sql`, only because that package had in-flight
 * edits on another branch when N-05 landed; moving both files there (and
 * adding the migration to `db-local.sh`'s apply order) is a mechanical
 * follow-up with no schema change.
 *
 * None of these tables has a `business_id` tenant column: staff are not tenants, and
 * `staff_audit_log.business_id` only records which tenant an action touched.
 */

import { bigint, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

/** The allowlist. A live row (`revoked_at IS NULL`) is what makes a user staff. */
export const staffMembers = pgTable('staff_members', {
  id: text('id').primaryKey(),
  /** `auth.users.id` from before in-house auth (0008); null for staff created since. */
  userId: text('user_id').unique(),
  email: text('email').notNull(),
  nombre: text('nombre').notNull(),
  createdAt: instant('created_at').notNull(),
  revokedAt: instant('revoked_at'),
  /** bcrypt, cost 10. Set only by `scripts/staff.ts`; the console cannot write it. */
  passwordHash: text('password_hash'),
  /** The TOTP seed, sealed with AES-256-GCM under `ADMIN_TOTP_KEY`, bound to `id`. */
  totpSecretEnc: text('totp_secret_enc'),
  totpEnrolledAt: instant('totp_enrolled_at'),
  /** The last TOTP step accepted — no code is accepted twice. */
  totpLastStep: bigint('totp_last_step', { mode: 'number' }),
  /** SHA-256 (hex) of each unused recovery code. */
  recoveryCodes: text('recovery_codes').array().notNull().default([]),
});

/** Server-side console sessions (0008). Only the token's SHA-256 is stored. */
export const staffSessions = pgTable(
  'staff_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    staffId: text('staff_id')
      .notNull()
      .references(() => staffMembers.id),
    aal: text('aal', { enum: ['aal1', 'aal2'] }).notNull(),
    createdAt: instant('created_at').notNull().defaultNow(),
    lastSeenAt: instant('last_seen_at').notNull().defaultNow(),
    expiresAt: instant('expires_at').notNull(),
    revokedAt: instant('revoked_at'),
  },
  (t) => [index('staff_sessions_staff_idx').on(t.staffId)],
);

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
