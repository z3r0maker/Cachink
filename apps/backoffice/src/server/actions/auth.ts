'use server';

import { clientIp } from '@xangarro/auth-core';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { clearSessionCookie, readSessionToken, setSessionCookie } from '../auth/cookie';
import { loginRefusalMessage } from '../auth/login-message';
import { signIn, signOut } from '../auth/sign-in';
import { authDeps } from '../auth/wiring';
import { dbFingerprint } from '../db/fingerprint';
import { LOGIN_PATH } from '../gate';
import { resolveGate } from '../resolve-gate';
import { field, type FormState } from './form-state';

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
  const result = await signIn(authDeps(), {
    email,
    password: typeof password === 'string' ? password : '',
    ip,
  });

  if (result.kind !== 'ok') {
    const detail = 'reason' in result ? ` (${result.reason})` : '';
    console.error(`[login] ${result.kind}${detail} email=${email} ip=${ip} db=${dbFingerprint()}`);
    return {
      ok: false,
      message: loginRefusalMessage(result, {
        on: process.env.ADMIN_DIAGNOSTICS === '1',
        db: dbFingerprint(),
      }),
    };
  }

  await setSessionCookie(result.token, 'aal1');
  redirect('/');
}

export async function logout(): Promise<never> {
  const token = await readSessionToken();
  const { session } = await resolveGate(token, LOGIN_PATH);
  await signOut(authDeps(), token, session?.staffId ?? null);
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}
