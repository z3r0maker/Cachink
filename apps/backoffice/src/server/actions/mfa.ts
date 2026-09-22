'use server';

import { minutes } from '@xangarro/auth-core';
import { redirect } from 'next/navigation';

import { setSessionCookie } from '../auth/cookie';
import type { EnrolmentResult } from '../auth/enrolment';
import { confirmEnrolment } from '../auth/enrolment';
import { classifyInfraFailure, infraFailureMessage } from '../auth/infra-failure';
import type { FactorResult, Refused } from '../auth/second-factor';
import { verifySecondFactor } from '../auth/second-factor';
import { authDeps } from '../auth/wiring';
import { dbFingerprint } from '../db/fingerprint';
import { MFA_ENROLL_PATH, MFA_VERIFY_PATH } from '../gate';
import { requireStaffPage } from '../staff';
import { field, type FormState } from './form-state';

/**
 * The MFA half of the same problem `attemptSignIn` solves (actions/auth.ts):
 * both steps build `authDeps()`, so both can die on a misconfigured
 * `ADMIN_TOTP_KEY` or `DATABASE_URL` before any code is checked.
 */
function infraState(error: unknown, step: string): FormState {
  const failure = classifyInfraFailure(error);
  console.error(`[mfa:${step}] infra ${failure.cause}/${failure.detail}`, error);
  return {
    ok: false,
    message: infraFailureMessage(failure, {
      on: process.env.ADMIN_DIAGNOSTICS === '1',
      db: dbFingerprint(),
    }),
  };
}

/**
 * The two MFA actions. Each re-runs the gate for its own path, which admits
 * only an allowlisted AAL1 session on the step the gate assigns it — so a
 * stranger is refused before MFA is offered, and an enrolled member can never
 * reach enrolment again.
 */
function refused(result: Refused): FormState {
  return result.kind === 'locked'
    ? {
        ok: false,
        message: `Demasiados intentos. Vuelve a intentar en ${minutes(result.wait)} min.`,
      }
    : { ok: false, message: 'El código no es válido o ya expiró. Intenta con el siguiente.' };
}

export type EnrolState =
  | FormState
  | { readonly ok: true; readonly message: string; readonly recoveryCodes: readonly string[] };

/** First code from the new authenticator; answers with the recovery codes, shown once. */
export async function confirmTotp(_prev: EnrolState, form: FormData): Promise<EnrolState> {
  const ctx = await requireStaffPage(MFA_ENROLL_PATH);
  let result: EnrolmentResult;
  try {
    result = await confirmEnrolment(authDeps(), ctx.session, field(form, 'code'));
  } catch (error) {
    return infraState(error, 'enroll');
  }
  if (result.kind !== 'ok') return refused(result);
  return {
    ok: true,
    message: 'Tu app quedó registrada. Guarda estos códigos de recuperación.',
    recoveryCodes: result.recoveryCodes,
  };
}

/** Every sign-in: a TOTP code or a recovery code raises the session to AAL2. */
export async function verifyCode(_prev: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireStaffPage(MFA_VERIFY_PATH);
  let result: FactorResult;
  try {
    result = await verifySecondFactor(authDeps(), ctx.session, field(form, 'code'), ctx.token);
  } catch (error) {
    return infraState(error, 'verify');
  }
  if (result.kind !== 'ok') return refused(result);
  await setSessionCookie(result.token, 'aal2');
  redirect('/');
}
