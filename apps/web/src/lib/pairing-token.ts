import { createHash, randomBytes } from 'node:crypto';
import { PAIRING_TOKEN_REGEX } from '@xangarro/contracts';

/**
 * The scannable pairing token (C-14, SEC-DEV-01, SEC-MOB-04).
 *
 * - 16 random bytes → 22 base64url characters: 128 bits, so guessing it is not
 *   a threat model and the 8-character code never has to leave the screen.
 * - Stored only as its SHA-256; the portal shows it once, in the QR it just
 *   minted, and a reload means minting another.
 * - 15 minutes, never outliving its code. The link carries it in the
 *   **fragment**, which browsers never send to a server, so it stays out of
 *   logs and Referer headers; nothing redeems on GET.
 *
 * Here, not under `server/`, so the conformance tooling mints with the same
 * function the portal uses (the `activation-code.ts` precedent).
 */
export const PAIRING_TOKEN_TTL_MS = 15 * 60 * 1000;

export function mintPairingToken(): string {
  const token = randomBytes(16).toString('base64url');
  if (!PAIRING_TOKEN_REGEX.test(token))
    throw new Error('Minted a pairing token the contract rejects');
  return token;
}

export function hashPairingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** `https://app.xangarro.mx/activar#c=<token>` — the fragment is the point. */
export function pairingLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/activar#c=${token}`;
}

/** The QR's expiry: 15 minutes from now, or the code's own expiry if that is sooner. */
export function pairingExpiry(now: Date, codeExpiresAt: string): string {
  const qr = now.getTime() + PAIRING_TOKEN_TTL_MS;
  return new Date(Math.min(qr, new Date(codeExpiresAt).getTime())).toISOString();
}
