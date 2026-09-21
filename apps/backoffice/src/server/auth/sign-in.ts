import {
  endSession,
  guardAttempt,
  issueSession,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  throttleKey,
  verifyPassword,
  type ThrottleSubject,
} from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import { AAL1_TTL_SECONDS } from './config';
import type { AuthDeps, LoginRecord } from './ports';

/**
 * Step one: email + password → an AAL1 session that can only reach /mfa/*.
 *
 * The portal's sign-in shape (ADR-079), through auth-core: throttled per
 * address and per IP *before* the password is checked, and an unknown address
 * costs the same bcrypt comparison as a known one. The throttle rows are the
 * portal's own table, under `admin:`-prefixed keys.
 *
 * `reason` says which of the three refusals happened — no login-able account
 * with that address, an account whose password was never set, or a set
 * password that did not match. It is for logs and dev-phase diagnostics only:
 * what the user sees stays one generic sentence (SEC-AUTH-02).
 */
export type SignInResult =
  | { readonly kind: 'ok'; readonly token: string }
  | { readonly kind: 'invalid'; readonly reason: 'empty-input' }
  | {
      readonly kind: 'failed';
      readonly reason: 'no-account' | 'no-password-set' | 'wrong-password';
    }
  | { readonly kind: 'locked'; readonly wait: number };

export interface SignInInput {
  readonly email: string;
  readonly password: string;
  readonly ip: string;
}

export const loginSubjects = (email: string, ip: string): ThrottleSubject[] => [
  {
    key: throttleKey('admin', 'login', 'email', email),
    policy: LOGIN_PER_EMAIL,
    clearOnSuccess: true,
  },
  { key: throttleKey('admin', 'login', 'ip', ip), policy: LOGIN_PER_IP, clearOnSuccess: false },
];

/** Which of the three credential refusals happened, from what the lookup saw. */
function failureReason(
  staff: LoginRecord | null,
): 'no-account' | 'no-password-set' | 'wrong-password' {
  if (staff === null) return 'no-account';
  if (staff.passwordHash === null) return 'no-password-set';
  return 'wrong-password';
}

export async function signIn(deps: AuthDeps, input: SignInInput): Promise<SignInResult> {
  const email = input.email.trim().toLowerCase();
  if (email === '' || input.password === '') {
    return { kind: 'invalid', reason: 'empty-input' };
  }

  const seen: { staff: LoginRecord | null } = { staff: null };
  const result = await guardAttempt(deps.throttle, loginSubjects(email, input.ip), async () => {
    seen.staff = await deps.repo.findForLogin(email);
    const ok = await verifyPassword(input.password, seen.staff?.passwordHash ?? null);
    return ok ? seen.staff : null;
  });

  if (result.kind !== 'ok') {
    if (seen.staff) {
      await deps.audit(seen.staff.id, 'auth.inicio_fallido', { bloqueo: result.kind === 'locked' });
    }
    if (result.kind === 'failed') {
      return { kind: 'failed', reason: failureReason(seen.staff) };
    }
    return result;
  }
  const subject = { staffId: result.value.id, aal: 'aal1' } as const;
  const token = await issueSession(deps.sessions, subject, AAL1_TTL_SECONDS);
  await deps.audit(result.value.id, 'auth.iniciar_sesion', { aal: 'aal1' });
  return { kind: 'ok', token };
}

/** Revoke the session behind the cookie. `staffId` is null when it was already dead. */
export async function signOut(
  deps: AuthDeps,
  token: string | undefined,
  staffId: StaffMemberId | null,
): Promise<void> {
  await endSession(deps.sessions, token);
  if (staffId !== null) await deps.audit(staffId, 'auth.cerrar_sesion');
}
