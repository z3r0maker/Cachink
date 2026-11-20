import type { RelyingParty } from '@xangarro/auth-core';

import { DEFAULT_CONSOLE_URL } from '../alerts/webhook-notifier';

/**
 * The console's session cookie, lifetimes and relying party (ADR-160).
 *
 * `__Host-` makes the browser refuse the cookie unless it is Secure, has
 * `Path=/` and no `Domain` — so no subdomain can set or shadow it.
 * `SameSite=Strict`: the console is never entered from a link on another site
 * with a session attached.
 *
 * Shorter than the portal's (30 d / 7 d idle): this console can read every
 * tenant. A passkey tap opens the full session; there is no lower step.
 */
export const ADMIN_COOKIE = '__Host-xg_admin';

export const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const IDLE_SECONDS = 30 * 60;
/** How long one tap (sign-in or a re-ask) unlocks adding or removing a passkey. */
export const STEP_UP_SECONDS = 5 * 60;
/** How long a printed enrolment link works. */
export const ENROL_LINK_SECONDS = 15 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  } as const;
}

/**
 * The relying party, from `ADMIN_BASE_URL` (default `https://admin.xangarro.mx`):
 * a passkey is bound to its host, and every response must come from its
 * exact origin. `http://localhost:<port>` is what development and e2e use.
 */
export function relyingParty(
  baseUrl: string | undefined = process.env.ADMIN_BASE_URL,
): RelyingParty {
  const url = new URL(baseUrl === undefined || baseUrl === '' ? DEFAULT_CONSOLE_URL : baseUrl);
  return { id: url.hostname, origin: url.origin, name: 'Xangarro Consola' };
}
