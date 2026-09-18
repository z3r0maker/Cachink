import { compare, hash } from 'bcryptjs';

import { AuthCoreError } from './errors.js';

/**
 * Passwords: bcrypt at cost 10, the same algorithm and cost the portal's
 * accounts (`auth.users.encrypted_password`) and the seed script use, so one
 * verifier reads both apps' hashes.
 */
export const BCRYPT_COST = 10;

/**
 * bcrypt, cost 10, of a random string nobody knows — only ever compared
 * against. An unknown account is checked against this, so a sign-in takes the
 * same time whether or not the address exists (audit SEC-AUTH-02).
 */
export const DUMMY_HASH = '$2b$10$8S3S44VqKonb5aKgKp4CQOeYprcpwCtEl/EmGvLTKhk1PcW/tRfcO';

/** bcrypt reads at most 72 bytes; anything past that would be silently ignored. */
export const MAX_PASSWORD_BYTES = 72;

export async function hashPassword(password: string): Promise<string> {
  if (password.length === 0) {
    throw new AuthCoreError('INVALID_ARGUMENT', 'La contraseña no puede estar vacía.');
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new AuthCoreError('INVALID_ARGUMENT', 'La contraseña es demasiado larga.');
  }
  return hash(password, BCRYPT_COST);
}

const BCRYPT_SHAPE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * True only when `stored` is a real hash and `password` matches it. With no
 * stored hash (unknown account, or none set yet) it still pays for one bcrypt
 * comparison against `DUMMY_HASH`, then answers false.
 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const real = stored !== null && BCRYPT_SHAPE.test(stored);
  const ok = await compare(password, real ? stored : DUMMY_HASH);
  return real && ok && password.length > 0;
}
