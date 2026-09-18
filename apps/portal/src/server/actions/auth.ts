'use server';

import {
  clientIp,
  guardAttempt,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  minutes,
  throttleKey,
  verifyPassword,
} from '@xangarro/auth-core';
import { loginLookup, throttleStore } from '@xangarro/data-pg';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { Role } from '@/session/types';

import { db } from '../db';
import { endSession, startSession } from '../session';

/**
 * Email + password sign-in (audit SEC-AUTH-02).
 *
 * - **Throttled** per address and per IP before the password is even checked.
 * - **Same cost either way**: an unknown address is compared against a dummy
 *   bcrypt hash, so response time does not reveal which addresses exist.
 * - **One hash, by email**: the app role cannot read `encrypted_password`;
 *   `xangarro.login_lookup` returns exactly one account's.
 *
 * The membership lookup runs outside any tenant transaction on purpose: it is
 * the query that decides *which* tenant (see `xangarro.memberships_for_user`).
 */
export type LoginResult = { ok: true } | { ok: false; message: string };

const WRONG = 'Correo o contraseña incorrectos.';

const tooMany = (wait: number): LoginResult => ({
  ok: false,
  message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min.`,
});

/** The account, if the password is its — the dummy compare is `verifyPassword`'s. */
async function passwordMatches(email: string, password: string) {
  const user = await loginLookup(db(), email);
  return (await verifyPassword(password, user?.hash ?? null)) && user?.hash ? user : null;
}

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

  const [member] = await db().execute<{ business_id: string; role: Role }>(
    sql`SELECT business_id, role FROM xangarro.memberships_for_user(${guarded.value.id})`,
  );
  if (!member) return { ok: false, message: 'Tu cuenta aún no pertenece a ningún negocio.' };

  await startSession(guarded.value.id, member.business_id);
  return { ok: true };
}

export async function logout(): Promise<never> {
  await endSession();
  redirect('/login');
}
