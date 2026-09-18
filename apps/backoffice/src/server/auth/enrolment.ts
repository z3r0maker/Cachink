import {
  AuthCoreError,
  generateRecoveryCodes,
  generateTotpSecret,
  guardAttempt,
  openSecret,
  otpauthUri,
  sealSecret,
  verifyTotp,
} from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import { TOTP_ISSUER } from './config';
import type { AuthDeps, StaffSession } from './ports';
import { auditRefusal, factorSubjects, type Refused } from './second-factor';

/**
 * What /mfa/enroll shows: the seed as a QR (`uri`) and as a key to type.
 *
 * The seed is generated once and stored sealed (pending) until a code
 * confirms it, so reloading the page shows the **same** QR the app may
 * already have scanned. A pending seed that no longer opens (the key was
 * rotated) is simply replaced — nothing depends on it yet.
 */
export interface EnrolmentView {
  readonly secret: string;
  readonly uri: string;
}

function openPending(deps: AuthDeps, id: StaffMemberId, sealed: string | null): string | null {
  if (sealed === null) return null;
  try {
    return openSecret(deps.totpKey, sealed, id);
  } catch (error) {
    if (error instanceof AuthCoreError) return null;
    throw error;
  }
}

/** Null when there is nothing to enrol: already enrolled, revoked, or a concurrent enrolment. */
export async function prepareEnrolment(
  deps: AuthDeps,
  staff: StaffSession,
): Promise<EnrolmentView | null> {
  const id = staff.staffId;
  const state = await deps.repo.totpState(id);
  if (state === null || state.enrolledAt !== null) return null;

  let secret = openPending(deps, id, state.secretEnc);
  if (secret === null) {
    secret = generateTotpSecret();
    const sealed = sealSecret(deps.totpKey, secret, id);
    const saved = await deps.repo.savePendingSecret(id, state.secretEnc, sealed);
    if (!saved) return null;
  }
  return { secret, uri: otpauthUri({ secret, account: staff.email, issuer: TOTP_ISSUER }) };
}

export type EnrolmentResult =
  | { readonly kind: 'ok'; readonly recoveryCodes: readonly string[] }
  | Refused;

/**
 * The first code proves the app holds the seed. Enrolment is recorded (with
 * that code's step, so it cannot be reused) and ten recovery codes are issued
 * — returned here once, stored only hashed. The session stays AAL1: the next
 * step is /mfa/verify with the *next* code, like every later sign-in.
 */
export async function confirmEnrolment(
  deps: AuthDeps,
  staff: StaffSession,
  code: string,
): Promise<EnrolmentResult> {
  const id = staff.staffId;
  const result = await guardAttempt(deps.throttle, factorSubjects(id), async () => {
    const state = await deps.repo.totpState(id);
    if (!state?.secretEnc || state.enrolledAt !== null) return null;
    const step = verifyTotp(openSecret(deps.totpKey, state.secretEnc, id), code, deps.now());
    if (step === null) return null;
    const set = generateRecoveryCodes();
    return (await deps.repo.completeEnrolment(id, step, set.hashes)) ? set : null;
  });
  if (result.kind !== 'ok') {
    await auditRefusal(deps, id, 'enrolar', result.kind === 'locked');
    return result;
  }
  await deps.audit(id, 'auth.enrolar_totp', { codigos_recuperacion: result.value.codes.length });
  return { kind: 'ok', recoveryCodes: result.value.codes };
}
