/**
 * The admin console's access rule, as one pure function (N-05, ADR-063).
 *
 * Identity is the console's own (ADR-080): a server-side session opened by
 * password sign-in, raised to AAL2 by a TOTP code. The facts that decide every
 * request are checked **in this order**:
 *
 *  1. no live session             → /login
 *  2. session, not allowlisted    → 403, even at AAL2 (a stranger with 2FA is
 *     still a stranger), and never offered MFA enrolment
 *  3. allowlisted, below AAL2     → /mfa/enroll (no authenticator yet) or
 *                                   /mfa/verify — and only that one
 *  4. allowlisted at AAL2         → through
 *
 * `src/proxy.ts` applies it to page requests; `requireStaff()` applies it
 * again inside every server action, because a proxy is an optimistic check
 * and an action can be invoked directly.
 */

export type Aal = 'aal1' | 'aal2';

export interface GateInput {
  readonly path: string;
  /** `staff_members.id` of the session, or null with no live session. */
  readonly staffId: string | null;
  /** The session's staff row is live (not revoked) — re-read on every request. */
  readonly isStaff: boolean;
  /** The session's assurance level; null is treated as AAL1. */
  readonly aal: Aal | null;
  /** The staff member has confirmed an authenticator (`totp_enrolled_at`). */
  readonly enrolled: boolean;
}

export type MfaPath = '/mfa/enroll' | '/mfa/verify';

export type GateDecision =
  | { readonly kind: 'allow' }
  | { readonly kind: 'redirect'; readonly to: '/login' | MfaPath | '/' }
  | { readonly kind: 'forbidden' };

export const LOGIN_PATH = '/login';
export const MFA_ENROLL_PATH = '/mfa/enroll';
export const MFA_VERIFY_PATH = '/mfa/verify';
export const FORBIDDEN_PATH = '/prohibido';

const PUBLIC_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH, FORBIDDEN_PATH]);
const MFA_PATHS: ReadonlySet<string> = new Set([MFA_ENROLL_PATH, MFA_VERIFY_PATH]);

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.has(path);
}

/**
 * Machine-to-machine routes (N-08 ingestion, N-10 cron). They carry no staff
 * session and authenticate themselves with a shared secret, so the proxy lets
 * them through untouched. Only these two prefixes, and only API routes: a page
 * can never be made reachable by naming it under one of them.
 */
const MACHINE_PREFIXES = ['/api/internal/', '/api/cron/'] as const;

export function isMachinePath(path: string): boolean {
  return MACHINE_PREFIXES.some((p) => path.startsWith(p)) && !path.includes('..');
}

/** The one MFA page an AAL1 session may see. */
export function mfaPathFor(enrolled: boolean): MfaPath {
  return enrolled ? MFA_VERIFY_PATH : MFA_ENROLL_PATH;
}

const ALLOW: GateDecision = { kind: 'allow' };

export function decideAccess(input: GateInput): GateDecision {
  if (isPublicPath(input.path)) return ALLOW;
  if (input.staffId === null) return { kind: 'redirect', to: LOGIN_PATH };
  if (!input.isStaff) return { kind: 'forbidden' };

  if (input.aal === 'aal2') {
    return MFA_PATHS.has(input.path) ? { kind: 'redirect', to: '/' } : ALLOW;
  }
  const step = mfaPathFor(input.enrolled);
  return input.path === step ? ALLOW : { kind: 'redirect', to: step };
}

/** Narrow a stored `aal` value. Anything unrecognised is not AAL2. */
export function toAal(value: unknown): Aal | null {
  return value === 'aal1' || value === 'aal2' ? value : null;
}
