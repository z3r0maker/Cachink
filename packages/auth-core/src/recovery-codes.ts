import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { base32Encode } from './base32.js';
import { AuthCoreError } from './errors.js';

/**
 * Recovery codes: the way back in when the authenticator is lost.
 *
 * Ten per enrolment, each single-use, shown once and stored only as SHA-256.
 * Each code is 80 random bits (16 base32 characters, shown as
 * `abcd-efgh-ijkl-mnop`), so — like a session token — a plain hash is enough:
 * there is nothing to brute-force from a stolen table the way there is with a
 * password. Consuming one is the store's job (remove the hash atomically).
 */
export const RECOVERY_CODE_COUNT = 10;
const CODE_BYTES = 10;
const CODE_SHAPE = /^[A-Z2-7]{16}$/;

/** Upper-case, no separators — or null if it cannot be one of ours. */
export function normalizeRecoveryCode(input: string): string | null {
  const clean = input.replace(/[\s-]/g, '').toUpperCase();
  return CODE_SHAPE.test(clean) ? clean : null;
}

export function looksLikeRecoveryCode(input: string): boolean {
  return normalizeRecoveryCode(input) !== null;
}

/** The stored form of a code, or null if the input is not code-shaped. */
export function hashRecoveryCode(input: string): string | null {
  const code = normalizeRecoveryCode(input);
  return code === null ? null : createHash('sha256').update(code).digest('hex');
}

const display = (code: string) => (code.toLowerCase().match(/.{4}/g) ?? []).join('-');

export interface RecoveryCodeSet {
  /** Show these once; never store them. */
  readonly codes: readonly string[];
  /** Store these. Same order as `codes`. */
  readonly hashes: readonly string[];
}

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): RecoveryCodeSet {
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new AuthCoreError('INVALID_ARGUMENT', 'Recovery code count must be 1–50.');
  }
  const codes = Array.from({ length: count }, () => display(base32Encode(randomBytes(CODE_BYTES))));
  const hashes = codes.map((c) => hashRecoveryCode(c) ?? '');
  return { codes, hashes };
}

/**
 * The stored hash `input` matches, or null. Every candidate is compared, in
 * constant time, so timing reveals neither whether nor which one matched.
 */
export function matchRecoveryCode(input: string, hashes: readonly string[]): string | null {
  const candidate = hashRecoveryCode(input);
  if (candidate === null) return null;
  const mine = Buffer.from(candidate, 'hex');
  let found: string | null = null;
  for (const h of hashes) {
    const theirs = Buffer.from(h, 'hex');
    const same = theirs.length === mine.length && timingSafeEqual(theirs, mine);
    if (same && found === null) found = h;
  }
  return found;
}
