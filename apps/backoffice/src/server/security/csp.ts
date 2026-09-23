/**
 * The admin console's Content-Security-Policy, built per request — through
 * the shared builder in `@xangarro/config/security` (one implementation for
 * both apps, SEC-WEB-01).
 *
 * There is no third-party origin at all: sign-in is the console's own (server
 * actions against Postgres), fonts come from the token stack, and the TOTP QR
 * code is rendered on the server as a `data:` SVG — hence `img-src data:`, and
 * nothing broader. No `'unsafe-inline'` anywhere: the console has no inline
 * style attributes.
 */
import { buildCsp as sharedCsp, newNonce as sharedNonce } from '@xangarro/config/security';

export function buildCsp(nonce: string, isDev: boolean): string {
  return sharedCsp({ nonce, isDev });
}

/** 128 random bits, base64 — unguessable and unique per request. */
export function newNonce(): string {
  return sharedNonce();
}
