/**
 * The admin console's access rule, as one pure function (N-05, ADR-063).
 *
 * Three facts decide every request — who is signed in (Supabase Auth), whether
 * they are on the `staff_members` allowlist, and the assurance level of their
 * session — and they are checked **in that order**:
 *
 *  1. nobody signed in            → /login
 *  2. signed in, not allowlisted  → 403, even at AAL2 (a stranger with 2FA is
 *     still a stranger), and never offered MFA enrolment
 *  3. allowlisted, below AAL2     → /mfa (enrol if no factor, else challenge)
 *  4. allowlisted at AAL2         → through
 *
 * `src/proxy.ts` applies it to page requests; `requireStaff()` applies it
 * again inside every server action, because a proxy is an optimistic check
 * and an action can be invoked directly.
 */

export type Aal = 'aal1' | 'aal2';

export interface GateInput {
  readonly path: string;
  /** `auth.users.id` from verified JWT claims, or null when signed out. */
  readonly userId: string | null;
  /** A live (non-revoked) `staff_members` row exists for `userId`. */
  readonly isStaff: boolean;
  /** The session's `aal` claim; null is treated as AAL1. */
  readonly aal: Aal | null;
}

export type GateDecision =
  | { readonly kind: 'allow' }
  | { readonly kind: 'redirect'; readonly to: '/login' | '/mfa' | '/' }
  | { readonly kind: 'forbidden' };

export const LOGIN_PATH = '/login';
export const MFA_PATH = '/mfa';
export const FORBIDDEN_PATH = '/prohibido';

const PUBLIC_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH, FORBIDDEN_PATH]);

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.has(path);
}

const ALLOW: GateDecision = { kind: 'allow' };

export function decideAccess(input: GateInput): GateDecision {
  if (isPublicPath(input.path)) return ALLOW;
  if (input.userId === null) return { kind: 'redirect', to: LOGIN_PATH };
  if (!input.isStaff) return { kind: 'forbidden' };

  const atAal2 = input.aal === 'aal2';
  if (input.path === MFA_PATH) return atAal2 ? { kind: 'redirect', to: '/' } : ALLOW;
  return atAal2 ? ALLOW : { kind: 'redirect', to: MFA_PATH };
}

/** What the /mfa page shows. Enrolment is only ever offered with no verified factor. */
export function mfaStep(input: {
  readonly aal: Aal | null;
  readonly verifiedFactors: number;
}): 'enrol' | 'challenge' | 'done' {
  if (input.aal === 'aal2') return 'done';
  return input.verifiedFactors > 0 ? 'challenge' : 'enrol';
}

/** Narrow a raw JWT `aal` claim. Anything unrecognised is not AAL2. */
export function toAal(value: unknown): Aal | null {
  return value === 'aal1' || value === 'aal2' ? value : null;
}
