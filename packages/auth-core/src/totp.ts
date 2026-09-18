import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { base32Decode, base32Encode } from './base32.js';
import { AuthCoreError } from './errors.js';

/**
 * TOTP (RFC 6238) over HOTP (RFC 4226), on `node:crypto` alone — about forty
 * lines, checked against both RFCs' published test vectors, so a dependency
 * would buy nothing but supply-chain surface in the sign-in path.
 *
 * The profile every authenticator app supports: HMAC-SHA-1, 6 digits, a 30 s
 * step, and ±1 step of tolerance for clock drift.
 */
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const TOTP_WINDOW = 1;
/** 160 bits, the RFC 4226 recommendation for an HMAC-SHA-1 key. */
export const TOTP_SECRET_BYTES = 20;

export type HotpAlgorithm = 'sha1' | 'sha256' | 'sha512';

/** RFC 4226 §5.3: HMAC the 8-byte counter, dynamically truncate, keep `digits`. */
export function hotp(
  key: Uint8Array,
  counter: number,
  digits: number = TOTP_DIGITS,
  algorithm: HotpAlgorithm = 'sha1',
): string {
  if (!Number.isSafeInteger(counter) || counter < 0 || digits < 6 || digits > 10) {
    throw new AuthCoreError('INVALID_ARGUMENT', 'Invalid HOTP counter or digit count.');
  }
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac(algorithm, key).update(message).digest();
  const offset = (mac[mac.length - 1] ?? 0) & 0x0f;
  const binary = mac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, '0');
}

/** The 30-second step a moment falls in. */
export function totpStep(at: Date): number {
  return Math.floor(at.getTime() / 1000 / TOTP_STEP_SECONDS);
}

/** A fresh random secret, base32 without padding (32 characters). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(TOTP_SECRET_BYTES));
}

/** The code an authenticator shows at `at`. */
export function totpCode(secret: string, at: Date): string {
  return hotp(base32Decode(secret), totpStep(at));
}

const sameCode = (a: string, b: string) => timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * The step `code` matches within ±`TOTP_WINDOW` of `now`, or null. A step at
 * or before `lastStep` — one already used to sign in — never matches, so a
 * code seen over someone's shoulder cannot be replayed within its window.
 */
export function verifyTotp(
  secret: string,
  code: string,
  now: Date,
  lastStep: number | null = null,
): number | null {
  const digits = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(digits)) return null;
  const key = base32Decode(secret);
  if (key.length === 0) throw new AuthCoreError('INVALID_ARGUMENT', 'Empty TOTP secret.');
  const current = totpStep(now);
  let matched: number | null = null;
  for (let step = current - TOTP_WINDOW; step <= current + TOTP_WINDOW; step++) {
    const fresh = lastStep === null || step > lastStep;
    if (sameCode(hotp(key, step), digits) && fresh && matched === null) matched = step;
  }
  return matched;
}

/**
 * The `otpauth://` URI an authenticator app scans (Key Uri Format). The label
 * is `issuer:account`, and the issuer is repeated as a parameter as the format
 * recommends.
 */
export function otpauthUri(input: {
  readonly secret: string;
  readonly account: string;
  readonly issuer: string;
}): string {
  if (input.account === '' || input.issuer === '' || input.issuer.includes(':')) {
    throw new AuthCoreError('INVALID_ARGUMENT', 'An otpauth URI needs an account and an issuer.');
  }
  base32Decode(input.secret);
  const label = `${encodeURIComponent(input.issuer)}:${encodeURIComponent(input.account)}`;
  const params = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
