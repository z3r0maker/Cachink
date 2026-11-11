import type { SecondFactorRepo, SessionStore, ThrottleStore, TotpState } from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import type { Aal } from '../gate';

/**
 * What the console's sign-in use cases need from the outside world. The
 * Postgres adapters are `db/staff-auth.ts` and `db/staff-sessions.ts`; tests
 * use `tests/support/auth.ts`. The use cases themselves are pure over these.
 */

/** A live session, with the staff row it belongs to read **now**. */
export interface StaffSession {
  readonly staffId: StaffMemberId;
  readonly email: string;
  readonly nombre: string;
  readonly aal: Aal;
  /** An authenticator has been confirmed (`totp_enrolled_at` is set). */
  readonly enrolled: boolean;
}

export interface SessionSubject {
  readonly staffId: StaffMemberId;
  readonly aal: Aal;
}

export type StaffSessionStore = SessionStore<SessionSubject, StaffSession>;

export interface LoginRecord {
  readonly id: StaffMemberId;
  readonly email: string;
  readonly passwordHash: string | null;
}

export type { TotpState };

/**
 * The staff row's sign-in half, plus the second-factor writes both apps share
 * (`SecondFactorRepo` in `@xangarro/auth-core`): a pending seed, enrolment,
 * the TOTP step and the recovery codes. Every write is conditional, so two
 * tabs or a replay can never both win.
 */
export interface StaffAuthRepo extends SecondFactorRepo<StaffMemberId> {
  /** The live staff row for an address (already lower-cased), or null. */
  findForLogin(email: string): Promise<LoginRecord | null>;
}

/** Writes one `staff_audit_log` row (`auth.*` actions). */
export type AuthAudit = (
  staffId: StaffMemberId,
  action: string,
  payload?: Readonly<Record<string, unknown>>,
) => Promise<void>;

export interface AuthDeps {
  readonly repo: StaffAuthRepo;
  readonly sessions: StaffSessionStore;
  readonly throttle: ThrottleStore;
  readonly audit: AuthAudit;
  /** 32-byte AES key from `ADMIN_TOTP_KEY`. */
  readonly totpKey: Uint8Array;
  readonly now: () => Date;
}
