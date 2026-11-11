import {
  endSession,
  guardAttempt,
  issueSession,
  throttleKey,
  TOTP_PER_ACCOUNT,
  useSecondFactor,
  type ThrottleSubject,
} from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import { AAL2_TTL_SECONDS } from './config';
import type { AuthDeps, StaffSession } from './ports';

/**
 * Step two, every sign-in: a TOTP code (or a recovery code) raises the session
 * to AAL2. Checking the code is `@xangarro/auth-core`'s `useSecondFactor`,
 * shared with the owner portal (N-83); the throttle subject, the audit rows
 * and the session swap are the console's.
 *
 * Success **replaces** the AAL1 session with a fresh AAL2 one — a new token,
 * the old one revoked — so a token captured before the second factor is
 * worthless after it. Wrong codes are throttled per staff member (5 per
 * 15 min, auth-core's `TOTP_PER_ACCOUNT`).
 */
export type Refused =
  | { readonly kind: 'failed' }
  | { readonly kind: 'locked'; readonly wait: number };
export type FactorResult = { readonly kind: 'ok'; readonly token: string } | Refused;

export const factorSubjects = (staffId: StaffMemberId): ThrottleSubject[] => [
  { key: throttleKey('admin', 'totp', staffId), policy: TOTP_PER_ACCOUNT, clearOnSuccess: true },
];

async function elevate(deps: AuthDeps, staffId: StaffMemberId, oldToken: string | undefined) {
  const token = await issueSession(deps.sessions, { staffId, aal: 'aal2' }, AAL2_TTL_SECONDS);
  await endSession(deps.sessions, oldToken);
  return token;
}

export async function auditRefusal(
  deps: AuthDeps,
  staffId: StaffMemberId,
  step: string,
  locked: boolean,
) {
  await deps.audit(staffId, 'auth.segundo_factor_fallido', { paso: step, bloqueo: locked });
}

/** Every later sign-in: a current TOTP code, or one unused recovery code. */
export async function verifySecondFactor(
  deps: AuthDeps,
  staff: StaffSession,
  input: string,
  oldToken: string | undefined,
): Promise<FactorResult> {
  const id = staff.staffId;
  const result = await guardAttempt(deps.throttle, factorSubjects(id), () =>
    useSecondFactor(deps, id, input),
  );
  if (result.kind !== 'ok') {
    await auditRefusal(deps, id, 'verificar', result.kind === 'locked');
    return result;
  }
  const token = await elevate(deps, id, oldToken);
  const used = result.value;
  if (used.method === 'recovery') {
    await deps.audit(id, 'auth.usar_codigo_recuperacion', { restantes: used.left });
  } else {
    await deps.audit(id, 'auth.verificar_totp');
  }
  return { kind: 'ok', token };
}
