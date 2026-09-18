'use server';

import { clientIp, minutes } from '@xangarro/auth-core';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { clearSessionCookie, readSessionToken, setSessionCookie } from '../auth/cookie';
import { signIn, signOut } from '../auth/sign-in';
import { authDeps } from '../auth/wiring';
import { LOGIN_PATH } from '../gate';
import { resolveGate } from '../resolve-gate';
import { field, type FormState } from './form-state';

/**
 * Email + password → an AAL1 session. The redirect to `/` goes back through
 * the proxy, which sends the staff member to /mfa/enroll or /mfa/verify.
 */
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const password = form.get('password');
  const result = await signIn(authDeps(), {
    email: field(form, 'email'),
    password: typeof password === 'string' ? password : '',
    ip: clientIp(await headers()),
  });
  switch (result.kind) {
    case 'invalid':
      return { ok: false, message: 'Escribe tu correo y tu contraseña.' };
    case 'failed':
      // One message for unknown account and wrong password alike.
      return { ok: false, message: 'Correo o contraseña incorrectos.' };
    case 'locked':
      return tooMany(result.wait);
    case 'ok':
      await setSessionCookie(result.token, 'aal1');
      redirect('/');
  }
}

export async function logout(): Promise<never> {
  const token = await readSessionToken();
  const { session } = await resolveGate(token, LOGIN_PATH);
  await signOut(authDeps(), token, session?.staffId ?? null);
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}

function tooMany(wait: number): FormState {
  return { ok: false, message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min.` };
}
