'use server';

import {
  loginLookup,
  throttleClear,
  throttleFail,
  throttleKey,
  throttleWait,
} from '@xangarro/data-pg';
import { compare } from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { Role } from '@/session/types';

import { db } from '../db';
import { endSession, startSession } from '../session';
import { clientIp, LOGIN_PER_EMAIL, LOGIN_PER_IP, minutes } from '../throttle-policy';

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
/** bcrypt, cost 10, of a random string nobody knows — only ever compared against. */
const DUMMY_HASH = '$2b$10$8S3S44VqKonb5aKgKp4CQOeYprcpwCtEl/EmGvLTKhk1PcW/tRfcO';

const tooMany = (wait: number): LoginResult => ({
  ok: false,
  message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min.`,
});

async function passwordMatches(email: string, password: string) {
  const user = await loginLookup(db(), email);
  const ok = await compare(password, user?.hash ?? DUMMY_HASH);
  return ok && user?.hash ? user : null;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const address = email.trim().toLowerCase();
  if (address.length === 0 || password.length === 0) {
    return { ok: false, message: 'Escribe tu correo y tu contraseña.' };
  }
  const byEmail = throttleKey('login', 'email', address);
  const byIp = throttleKey('login', 'ip', clientIp(await headers()));
  const wait = Math.max(await throttleWait(db(), byEmail), await throttleWait(db(), byIp));
  if (wait > 0) return tooMany(wait);

  const user = await passwordMatches(address, password);
  if (user === null) {
    const locked = Math.max(
      await throttleFail(db(), byEmail, LOGIN_PER_EMAIL),
      await throttleFail(db(), byIp, LOGIN_PER_IP),
    );
    return locked > 0 ? tooMany(locked) : { ok: false, message: WRONG };
  }
  await throttleClear(db(), byEmail);

  const [member] = await db().execute<{ business_id: string; role: Role }>(
    sql`SELECT business_id, role FROM xangarro.memberships_for_user(${user.id})`,
  );
  if (!member) return { ok: false, message: 'Tu cuenta aún no pertenece a ningún negocio.' };

  await startSession(user.id, member.business_id);
  return { ok: true };
}

export async function logout(): Promise<never> {
  await endSession();
  redirect('/login');
}
