import type {
  ChallengeStore,
  NewPasskey,
  PasskeyRepo,
  RelyingParty,
  SessionStore,
  ThrottleStore,
} from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

/**
 * What the console's sign-in use cases need from the outside world (ADR-160).
 * The Postgres adapters are `db/staff-passkeys.ts`, `db/staff-links.ts`,
 * `db/staff-challenges.ts` and `db/staff-sessions.ts`; tests use
 * `tests/support/auth.ts`. The use cases themselves are pure over these.
 */

/** A live session, with the staff row and the passkey behind it read **now**. */
export interface StaffSession {
  readonly staffId: StaffMemberId;
  readonly email: string;
  readonly nombre: string;
  /** The passkey that opened it: removing that passkey ends the session. */
  readonly passkeyId: string;
  /** The last tap on this session (the sign-in counts). */
  readonly steppedUpAt: Date;
  readonly openedAt: Date;
  readonly expiresAt: Date;
}

export interface SessionSubject {
  readonly staffId: StaffMemberId;
  readonly passkeyId: string;
}

export interface StaffSessionStore extends SessionStore<SessionSubject, StaffSession> {
  /** Records a fresh tap on a live session. */
  stepUp(tokenHash: string): Promise<void>;
}

/** One live passkey, as «Mi acceso» lists it. */
export interface PasskeyView {
  readonly id: string;
  readonly nombre: string;
  readonly backedUp: boolean;
  readonly createdAt: Date;
  readonly lastUsedAt: Date | null;
}

export type PasskeyOrigin = 'enlace' | 'mi_acceso';

export interface StaffPasskeyRepo extends PasskeyRepo<StaffMemberId> {
  /** A member's live passkeys, oldest first. */
  listFor(staffId: StaffMemberId): Promise<readonly PasskeyView[]>;
  /** Stores a passkey registered from «Mi acceso»; false if the member is gone. */
  add(staffId: StaffMemberId, passkey: NewPasskey, nombre: string): Promise<boolean>;
  /** Removes one, unless it is the member's last live passkey. */
  remove(staffId: StaffMemberId, passkeyId: string): Promise<'removed' | 'last' | 'missing'>;
}

/** A printed enrolment link, by the hash of its token. */
export interface LinkRecord {
  readonly staffId: StaffMemberId;
  readonly email: string;
  readonly nombre: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  /** Voided by a newer link, or the member was revoked. */
  readonly dead: boolean;
}

export interface EnrolmentLinkRepo {
  find(tokenHash: string): Promise<LinkRecord | null>;
  /**
   * Spends the link and stores its passkey in one transaction; null when the
   * link was already used, voided or expired by then.
   */
  spend(tokenHash: string, passkey: NewPasskey, nombre: string): Promise<StaffMemberId | null>;
}

/** Writes one `staff_audit_log` row (`auth.*` actions). */
export type AuthAudit = (
  staffId: StaffMemberId,
  action: string,
  payload?: Readonly<Record<string, unknown>>,
) => Promise<void>;

export interface AuthDeps {
  readonly rp: RelyingParty;
  readonly challenges: ChallengeStore;
  readonly passkeys: StaffPasskeyRepo;
  readonly links: EnrolmentLinkRepo;
  readonly sessions: StaffSessionStore;
  readonly throttle: ThrottleStore;
  readonly audit: AuthAudit;
  readonly now: () => Date;
}
