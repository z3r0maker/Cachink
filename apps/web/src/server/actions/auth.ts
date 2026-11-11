'use server';

import {
  clientIp,
  guardAttempt,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  minutes,
  throttleKey,
} from '@xangarro/auth-core';
import { throttleStore } from '@xangarro/data-pg';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { aplicarEntrada, type Destino } from '../acceso/aplicar';
import { trasCredencial } from '../acceso/entrar';
import { accessDeps } from '../acceso/live';
import { db } from '../db';
import { passwordMatches } from '../password';
import { endSession } from '../session';

/**
 * Email + password sign-in (audit SEC-AUTH-02).
 *
 * - **Throttled** per address and per IP before the password is even checked.
 * - **Same cost either way**: an unknown address is compared against a dummy
 *   bcrypt hash, so response time does not reveal which addresses exist.
 * - **One hash, by email**: the app role cannot read `encrypted_password`;
 *   `xangarro.login_lookup` returns exactly one account's.
 * - **The password is only the first step** (N-83, ADR-142): what opens is
 *   `trasCredencial`'s call. An unconfirmed address gets «Revisa tu correo»
 *   and no session; an account with the second factor gets a challenge and no
 *   session. Both are told only to someone who typed the right password.
 */
export type LoginResult = Destino;

const WRONG = 'Correo o contraseña incorrectos.';

const tooMany = (wait: number): LoginResult => ({
  ok: false,
  message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min.`,
});

export async function login(email: string, password: string): Promise<LoginResult> {
  const address = email.trim().toLowerCase();
  if (address.length === 0 || password.length === 0) {
    return { ok: false, message: 'Escribe tu correo y tu contraseña.' };
  }
  // Locked → refuse; wrong → count both; right → forget the address, not the IP.
  const guarded = await guardAttempt(
    throttleStore(db()),
    [
      {
        key: throttleKey('login', 'email', address),
        policy: LOGIN_PER_EMAIL,
        clearOnSuccess: true,
      },
      {
        key: throttleKey('login', 'ip', clientIp(await headers())),
        policy: LOGIN_PER_IP,
        clearOnSuccess: false,
      },
    ],
    () => passwordMatches(address, password),
  );
  if (guarded.kind === 'locked') return tooMany(guarded.wait);
  if (guarded.kind === 'failed') return { ok: false, message: WRONG };

  return aplicarEntrada(await trasCredencial(accessDeps(), guarded.value, 'password'));
}

export async function logout(): Promise<never> {
  await endSession();
  redirect('/login');
}
