import type { Aal } from '../gate';

/**
 * The console's session cookie and lifetimes.
 *
 * `__Host-` makes the browser refuse the cookie unless it is Secure, has
 * `Path=/` and no `Domain` — so no subdomain can set or shadow it.
 * `SameSite=Strict`: the console is never entered from a link on another site
 * with a session attached.
 *
 * Shorter than the portal's (30 d / 7 d idle): this console can read every
 * tenant. A password-only (AAL1) session exists only to reach /mfa/*.
 */
export const ADMIN_COOKIE = '__Host-xg_admin';

export const AAL1_TTL_SECONDS = 15 * 60;
export const AAL2_TTL_SECONDS = 12 * 60 * 60;
export const IDLE_SECONDS = 30 * 60;

/** The name an authenticator app lists the console under. */
export const TOTP_ISSUER = 'Xangarro Consola';

export const ttlFor = (aal: Aal): number => (aal === 'aal2' ? AAL2_TTL_SECONDS : AAL1_TTL_SECONDS);

export function sessionCookieOptions(aal: Aal) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: ttlFor(aal),
  } as const;
}
