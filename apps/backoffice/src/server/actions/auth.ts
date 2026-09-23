'use server';

import { clientIp } from '@xangarro/auth-core';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { clearSessionCookie, readSessionToken, setSessionCookie } from '../auth/cookie';
import { classifyInfraFailure, infraFailureMessage } from '../auth/infra-failure';
import type { InfraFailure } from '../auth/infra-failure';
import type { Diagnostics } from '../auth/login-message';
import { loginRefusalMessage } from '../auth/login-message';
import type { SignInInput, SignInResult } from '../auth/sign-in';
import { signIn, signOut } from '../auth/sign-in';
import { authDeps } from '../auth/wiring';
import { dbFingerprint } from '../db/fingerprint';
import { LOGIN_PATH } from '../gate';
import { resolveGate } from '../resolve-gate';
import { field, type FormState } from './form-state';

/** What the banner may say beyond the generic refusal; dev phase only. */
function diagnostics(): Diagnostics {
  return { on: process.env.ADMIN_DIAGNOSTICS === '1', db: dbFingerprint() };
}

type Attempt = SignInResult | { readonly kind: 'infra'; readonly failure: InfraFailure };

/**
 * A throw from here is a misconfigured deployment, not a bad credential: a
 * `DATABASE_URL` the database rejects, a missing `ADMIN_TOTP_KEY`. Turning it
 * into a result keeps the form on screen and the cause in the logs, instead
 * of Next's generic error page — which redacts the cause in production.
 */
async function attemptSignIn(input: SignInInput): Promise<Attempt> {
  try {
    return await signIn(authDeps(), input);
  } catch (error) {
    const failure = classifyInfraFailure(error);
    console.error(`[login] infra ${failure.cause}/${failure.detail} db=${dbFingerprint()}`, error);
    return { kind: 'infra', failure };
  }
}

/**
 * Email + password → an AAL1 session. The redirect to `/` goes back through
 * the proxy, which sends the staff member to /mfa/enroll or /mfa/verify.
 *
 * Every refusal logs its reason and the database consulted server-side, so
 * Vercel's runtime logs answer "what actually happened" even when the banner
 * (deliberately) does not.
 */
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = field(form, 'email');
  const password = form.get('password');
  const ip = clientIp(await headers());
  const result = await attemptSignIn({
    email,
    password: typeof password === 'string' ? password : '',
    ip,
  });

  if (result.kind === 'infra') {
    return { ok: false, message: infraFailureMessage(result.failure, diagnostics()) };
  }

  if (result.kind !== 'ok') {
    const detail = 'reason' in result ? ` (${result.reason})` : '';
    console.error(`[login] ${result.kind}${detail} email=${email} ip=${ip} db=${dbFingerprint()}`);
    return { ok: false, message: loginRefusalMessage(result, diagnostics()) };
  }

  await setSessionCookie(result.token, 'aal1');
  redirect('/');
}

/**
 * Signing out always ends at the login page with the cookie gone. A database
 * that cannot record the revocation must not strand a staff member in a
 * session they asked to end, so the server-side half is best-effort and
 * logged; the cookie is what the browser actually holds.
 */
export async function logout(): Promise<never> {
  const token = await readSessionToken();
  try {
    const { session } = await resolveGate(token, LOGIN_PATH);
    await signOut(authDeps(), token, session?.staffId ?? null);
  } catch (error) {
    const failure = classifyInfraFailure(error);
    console.error(`[logout] infra ${failure.cause}/${failure.detail}`, error);
  }
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}
