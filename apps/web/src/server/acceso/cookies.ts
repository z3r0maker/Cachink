import 'server-only';

import { isPlausibleToken } from '@xangarro/auth-core';
import { cookies } from 'next/headers';

import { CHALLENGE_TTL_SECONDS, PENDING_TTL_SECONDS } from './plazos';

/**
 * The two short-lived cookies of N-83 (ADR-142). Neither is a session: each
 * holds 256 random bits whose hash sits in `xangarro.auth_links`, and opens
 * nothing by itself.
 *
 * - `xg_pending`: the browser that signed up, until the address is confirmed.
 *   It allows «Mandar otro enlace» and «Corregir mi correo», nothing else.
 * - `xg_2fa`: the password was right and the second factor is still owed.
 */
const PENDING_COOKIE = 'xg_pending';
const CHALLENGE_COOKIE = 'xg_2fa';

const options = (maxAge: number) =>
  ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }) as const;

async function leer(name: string): Promise<string | undefined> {
  const value = (await cookies()).get(name)?.value;
  return isPlausibleToken(value) ? value : undefined;
}

export const leerPase = (): Promise<string | undefined> => leer(PENDING_COOKIE);
export const leerReto = (): Promise<string | undefined> => leer(CHALLENGE_COOKIE);

export async function guardarPase(token: string): Promise<void> {
  (await cookies()).set(PENDING_COOKIE, token, options(PENDING_TTL_SECONDS));
}

export async function guardarReto(token: string): Promise<void> {
  (await cookies()).set(CHALLENGE_COOKIE, token, options(CHALLENGE_TTL_SECONDS));
}

/** Once a session exists, neither cookie has anything left to say. */
export async function borrarPaseYReto(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
  jar.delete(CHALLENGE_COOKIE);
}
