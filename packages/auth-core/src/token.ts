import { createHash, randomBytes } from 'node:crypto';

import { AuthCoreError } from './errors.js';

/**
 * Session tokens (ADR-079): 256 random bits, base64url, meaningless on their
 * own. The server stores only `hashToken(token)`, so a copy of the sessions
 * table opens nothing.
 */
export const TOKEN_BYTES = 32;

/** 32 bytes → 43 base64url characters, no padding. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

export function mintToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** SHA-256, hex. A token is already 256 random bits, so no salt or stretching is needed. */
export function hashToken(token: string): string {
  if (token.length === 0) {
    throw new AuthCoreError('INVALID_ARGUMENT', 'Empty token.');
  }
  return createHash('sha256').update(token).digest('hex');
}

/** Whether a cookie value could be one of ours — lets a resolver skip the database for junk. */
export function isPlausibleToken(value: string | null | undefined): value is string {
  return typeof value === 'string' && TOKEN_SHAPE.test(value);
}
