import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison of a presented shared secret with the configured
 * one. Both sides are hashed first so the comparison is always over 32 bytes:
 * `timingSafeEqual` throws on unequal lengths, and returning early on a length
 * mismatch would leak the secret's length. An empty expected secret matches
 * nothing — an unset variable must never open the door.
 */
export function secretMatches(given: string | null | undefined, expected: string): boolean {
  if (expected === '' || given === null || given === undefined) return false;
  const a = createHash('sha256').update(given, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}
