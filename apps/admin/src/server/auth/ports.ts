import type { SessionStore, ThrottleStore } from '@xangarro/auth-core';
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

export interface TotpState {
  /** Sealed seed; present while enrolling and once enrolled. */
  readonly secretEnc: string | null;
  readonly enrolledAt: string | null;
  readonly lastStep: number | null;
}

/** Every write is conditional, so two tabs or a replay can never both win. */
export interface StaffAuthRepo {
  /** The live staff row for an address (already lower-cased), or null. */
  findForLogin(email: string): Promise<LoginRecord | null>;
  totpState(staffId: StaffMemberId): Promise<TotpState | null>;
  /**
   * Store a pending seed — only while not enrolled and the stored one is still
   * `previous` (compare-and-swap), so two tabs cannot each show a different QR.
   */
  savePendingSecret(
    staffId: StaffMemberId,
    previous: string | null,
    sealed: string,
  ): Promise<boolean>;
  /** Mark enrolled with its first step and recovery hashes — only if not yet enrolled. */
  completeEnrolment(
    staffId: StaffMemberId,
    step: number,
    recoveryHashes: readonly string[],
  ): Promise<boolean>;
  /** Record `step` as used — only if it is newer than the last one. */
  advanceStep(staffId: StaffMemberId, step: number): Promise<boolean>;
  /** Remove one recovery-code hash; the number left, or null if it was not there. */
  consumeRecoveryCode(staffId: StaffMemberId, hash: string): Promise<number | null>;
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
