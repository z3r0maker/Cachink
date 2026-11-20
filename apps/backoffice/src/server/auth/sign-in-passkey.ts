import {
  endSession,
  finishPasskeyAssertion,
  guardAttempt,
  issueSession,
  LOGIN_PER_IP,
  startPasskeyAssertion,
  throttleKey,
  type AssertionResult,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type ThrottleSubject,
} from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import { SESSION_TTL_SECONDS } from './config';
import type { AuthDeps } from './ports';

/**
 * Sign-in with a passkey (N-85, ADR-160): the browser offers whichever of the
 * team's passkeys the device holds, so there is no email to type, and one
 * verified tap opens the full session. The passkey's id rides on the session,
 * so removing that passkey ends it.
 *
 * Refusals are counted per IP (the shared `xangarro.throttle`, `admin:` keys)
 * and checked before anything else; there is no address to count per account.
 * `reason` is for logs and tests: the page says one generic sentence.
 */
export type SignInStart =
  | { readonly kind: 'ok'; readonly options: PublicKeyCredentialRequestOptionsJSON }
  | { readonly kind: 'locked'; readonly wait: number };

type Refusal = Extract<AssertionResult<StaffMemberId>, { ok: false }>['reason'];

export type SignInResult =
  | { readonly kind: 'ok'; readonly token: string }
  | { readonly kind: 'failed'; readonly reason: Refusal }
  | { readonly kind: 'locked'; readonly wait: number };

export const signInSubjects = (ip: string): ThrottleSubject[] => [
  { key: throttleKey('admin', 'passkey', 'ip', ip), policy: LOGIN_PER_IP, clearOnSuccess: false },
];

export async function startSignIn(deps: AuthDeps, ip: string): Promise<SignInStart> {
  const [subject] = signInSubjects(ip);
  const wait = subject === undefined ? 0 : await deps.throttle.wait(subject.key);
  if (wait > 0) return { kind: 'locked', wait };
  return { kind: 'ok', options: await startPasskeyAssertion(deps, 'login') };
}

export async function finishSignIn(
  deps: AuthDeps,
  response: AuthenticationResponseJSON,
  ip: string,
): Promise<SignInResult> {
  const seen: { refusal: Extract<AssertionResult<StaffMemberId>, { ok: false }> | null } = {
    refusal: null,
  };
  const guarded = await guardAttempt(deps.throttle, signInSubjects(ip), async () => {
    const result = await finishPasskeyAssertion(deps, 'login', response);
    if (result.ok) return result;
    seen.refusal = result;
    return null;
  });
  const refusal = seen.refusal;
  if (refusal?.reason === 'counter') {
    await deps.audit(refusal.ownerId, 'auth.llave_contador_invalido', {
      llave: refusal.credentialId,
    });
  }
  if (guarded.kind === 'locked') return guarded;
  if (guarded.kind === 'failed') return { kind: 'failed', reason: refusal?.reason ?? 'invalid' };

  const { ownerId, credentialId } = guarded.value;
  const token = await issueSession(
    deps.sessions,
    { staffId: ownerId, passkeyId: credentialId },
    SESSION_TTL_SECONDS,
  );
  await deps.audit(ownerId, 'auth.entrar_llave', { llave: credentialId });
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
