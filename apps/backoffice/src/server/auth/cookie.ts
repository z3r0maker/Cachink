import 'server-only';

import { cookies } from 'next/headers';

import { ADMIN_COOKIE, sessionCookieOptions } from './config';

/** The raw session token from this request's cookie, if any. */
export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_COOKIE)?.value;
}

/** Only server actions can write cookies; pages and layouts never call this. */
export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  // `__Host-` cookies must be deleted with the same Secure/Path attributes.
  (await cookies()).set(ADMIN_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
}
