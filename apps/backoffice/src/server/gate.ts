/**
 * The admin console's access rule, as one pure function (N-05, ADR-063).
 *
 * Identity is the console's own (ADR-080): a server-side session opened by a
 * passkey (ADR-160). The passkey is discoverable and user-verified, so one tap
 * is both factors and there is no lower assurance step to route through. The
 * facts that decide every request are checked **in this order**:
 *
 *  1. a public page                → through
 *  2. no live session              → /login
 *  3. session, not allowlisted     → 403
 *  4. allowlisted                  → through
 *
 * `src/proxy.ts` applies it to page requests; `requireStaff()` applies it
 * again inside every server action, because a proxy is an optimistic check
 * and an action can be invoked directly.
 */

export interface GateInput {
  readonly path: string;
  /** `staff_members.id` of the session, or null with no live session. */
  readonly staffId: string | null;
  /** The session's staff row is live (not revoked) — re-read on every request. */
  readonly isStaff: boolean;
}

export type GateDecision =
  | { readonly kind: 'allow' }
  | { readonly kind: 'redirect'; readonly to: '/login' }
  | { readonly kind: 'forbidden' };

export const LOGIN_PATH = '/login';
export const FORBIDDEN_PATH = '/prohibido';
/** Where a printed enrolment link lands; the token rides in the fragment, never the path. */
export const ENROL_PATH = '/acceso/registrar';
export const MI_ACCESO_PATH = '/mi-acceso';

const PUBLIC_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH, FORBIDDEN_PATH, ENROL_PATH]);

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

const ALLOW: GateDecision = { kind: 'allow' };

export function decideAccess(input: GateInput): GateDecision {
  if (isPublicPath(input.path)) return ALLOW;
  if (input.staffId === null) return { kind: 'redirect', to: LOGIN_PATH };
  if (!input.isStaff) return { kind: 'forbidden' };
  return ALLOW;
}
