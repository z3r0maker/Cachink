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

import {
  bigint,
  boolean,
  customType,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

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
  // password_hash, totp_* and recovery_codes still exist in the table until
  // release 2 of ADR-160 drops them; nothing reads them since 0023.
});

/** Server-side console sessions (0008). Only the token's SHA-256 is stored. */
export const staffSessions = pgTable(
  'staff_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    staffId: text('staff_id')
      .notNull()
      .references(() => staffMembers.id),
    /** Always `aal2` since passkeys (ADR-160); the column and its CHECK predate them. */
    aal: text('aal', { enum: ['aal1', 'aal2'] }).notNull(),
    createdAt: instant('created_at').notNull().defaultNow(),
    lastSeenAt: instant('last_seen_at').notNull().defaultNow(),
    expiresAt: instant('expires_at').notNull(),
    revokedAt: instant('revoked_at'),
    /** The passkey that opened it (0023); null for a pre-passkey session, which no longer resolves. */
    passkeyId: text('passkey_id'),
    /** The last tap on this session: unlocks adding or removing a passkey for 5 minutes. */
    steppedUpAt: instant('stepped_up_at'),
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

const bytea = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType: () => 'bytea',
  toDriver: (value) => Buffer.from(value),
  fromDriver: (value) => new Uint8Array(value),
});

/** Passkeys (0023, ADR-160). `id` is the WebAuthn credential id, base64url. */
export const staffPasskeys = pgTable('staff_passkeys', {
  id: text('id').primaryKey(),
  staffId: text('staff_id')
    .notNull()
    .references(() => staffMembers.id),
  /** COSE_Key bytes. */
  publicKey: bytea('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).notNull().default(0),
  transports: text('transports').array().notNull().default([]),
  aaguid: text('aaguid').notNull(),
  backedUp: boolean('backed_up').notNull(),
  nombre: text('nombre').notNull(),
  origen: text('origen', { enum: ['enlace', 'mi_acceso'] }).notNull(),
  createdAt: instant('created_at').notNull().defaultNow(),
  lastUsedAt: instant('last_used_at'),
  revokedAt: instant('revoked_at'),
});

/** One-time enrolment links (0023), minted by `scripts/staff.ts`; only the token hash is kept. */
export const staffEnrolmentLinks = pgTable('staff_enrolment_links', {
  tokenHash: text('token_hash').primaryKey(),
  staffId: text('staff_id')
    .notNull()
    .references(() => staffMembers.id),
  createdAt: instant('created_at').notNull().defaultNow(),
  expiresAt: instant('expires_at').notNull(),
  usedAt: instant('used_at'),
  voidedAt: instant('voided_at'),
});

/** Single-use WebAuthn challenges (0023), by hash, each bound to one ceremony. */
export const staffWebauthnChallenges = pgTable('staff_webauthn_challenges', {
  challengeHash: text('challenge_hash').primaryKey(),
  purpose: text('purpose').notNull(),
  expiresAt: instant('expires_at').notNull(),
});
