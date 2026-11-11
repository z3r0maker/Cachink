import {
  confirmTotpEnrolment,
  guardAttempt,
  prepareTotpEnrolment,
  type EnrolmentView,
} from '@xangarro/auth-core';

import { TOTP_ISSUER } from './config';
import type { AuthDeps, StaffSession } from './ports';
import { auditRefusal, factorSubjects, type Refused } from './second-factor';

/**
 * What /mfa/enroll shows: the seed as a QR (`uri`) and as a key to type. The
 * seed, its sealing and the compare-and-swap are `@xangarro/auth-core`'s
 * (`prepareTotpEnrolment`), shared with the owner portal (N-83).
 */
export type { EnrolmentView };

/** Null when there is nothing to enrol: already enrolled, revoked, or a concurrent enrolment. */
export function prepareEnrolment(
  deps: AuthDeps,
  staff: StaffSession,
): Promise<EnrolmentView | null> {
  return prepareTotpEnrolment(deps, staff.staffId, { account: staff.email, issuer: TOTP_ISSUER });
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
  const result = await guardAttempt(deps.throttle, factorSubjects(id), () =>
    confirmTotpEnrolment(deps, id, code),
  );
  if (result.kind !== 'ok') {
    await auditRefusal(deps, id, 'enrolar', result.kind === 'locked');
    return result;
  }
  await deps.audit(id, 'auth.enrolar_totp', { codigos_recuperacion: result.value.codes.length });
  return { kind: 'ok', recoveryCodes: result.value.codes };
}
