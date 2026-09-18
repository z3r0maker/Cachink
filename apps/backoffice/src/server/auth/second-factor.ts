import {
  endSession,
  guardAttempt,
  hashRecoveryCode,
  issueSession,
  looksLikeRecoveryCode,
  openSecret,
  throttleKey,
  TOTP_PER_ACCOUNT,
  verifyTotp,
  type ThrottleSubject,
} from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import { AAL2_TTL_SECONDS } from './config';
import type { AuthDeps, StaffSession } from './ports';

/**
 * Step two, every sign-in: a TOTP code (or a recovery code) raises the session
 * to AAL2.
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

type Used = { readonly method: 'totp' } | { readonly method: 'recuperacion'; left: number };

async function useTotp(deps: AuthDeps, id: StaffMemberId, code: string): Promise<Used | null> {
  const state = await deps.repo.totpState(id);
  if (!state?.secretEnc || state.enrolledAt === null) return null;
  const secret = openSecret(deps.totpKey, state.secretEnc, id);
  const step = verifyTotp(secret, code, deps.now(), state.lastStep);
  if (step === null) return null;
  return (await deps.repo.advanceStep(id, step)) ? { method: 'totp' } : null;
}

async function useRecovery(deps: AuthDeps, id: StaffMemberId, code: string): Promise<Used | null> {
  const hash = hashRecoveryCode(code);
  const left = hash === null ? null : await deps.repo.consumeRecoveryCode(id, hash);
  return left === null ? null : { method: 'recuperacion', left };
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
    looksLikeRecoveryCode(input) ? useRecovery(deps, id, input) : useTotp(deps, id, input),
  );
  if (result.kind !== 'ok') {
    await auditRefusal(deps, id, 'verificar', result.kind === 'locked');
    return result;
  }
  const token = await elevate(deps, id, oldToken);
  const used = result.value;
  if (used.method === 'recuperacion') {
    await deps.audit(id, 'auth.usar_codigo_recuperacion', { restantes: used.left });
  } else {
    await deps.audit(id, 'auth.verificar_totp');
  }
  return { kind: 'ok', token };
}
