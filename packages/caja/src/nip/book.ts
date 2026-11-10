/**
 * Every subject's NIP lockout on one device, as it is stored (audit F-08):
 * a versioned map from the user whose NIP is checked to that NIP's own
 * `{failures, lockedUntil, level}`, kept in app_config under one key.
 *
 *   { "v": 2, "by": { "<userId>": { "failures": 0, "lockedUntil": "…", "level": 1 } } }
 *
 * Two earlier shapes may still be in a device's store: `{failures,
 * lockedUntil}` (the 30 s cooldown) and `{failures, lockedUntil, level}`
 * (the device-wide ladder). Neither says whose NIP it counted, so both read
 * as no lockouts: a device updated mid-lock loses that one lock, and the
 * next write replaces the value with the map.
 *
 * A clean entry is never written, so the map holds only the NIPs someone is
 * getting wrong.
 */

import { NO_LOCKOUT, asPinLockout, isCleanLockout, type PinLockoutState } from './lockout';

/** The app_config key the map is stored under, on the phone and the web caja. */
export const PIN_LOCKOUT_KEY = 'pinLockout';

export interface PinLockoutBook {
  readonly v: 2;
  /** Subject (user id) to that NIP's lockout; a clean subject is absent. */
  readonly by: Readonly<Record<string, PinLockoutState>>;
}

export const NO_LOCKOUTS: PinLockoutBook = { v: 2, by: {} };

export function lockoutOf(book: PinLockoutBook, subject: string): PinLockoutState {
  return Object.hasOwn(book.by, subject) ? (book.by[subject] ?? NO_LOCKOUT) : NO_LOCKOUT;
}

/** `book` with `subject` at `state`, without any entry that is clean. */
export function withLockout(
  book: PinLockoutBook,
  subject: string,
  state: PinLockoutState,
): PinLockoutBook {
  const entries = Object.entries({ ...book.by, [subject]: state });
  return { v: 2, by: Object.fromEntries(entries.filter(([, s]) => !isCleanLockout(s))) };
}

function readBook(value: unknown): PinLockoutBook {
  if (value === null || typeof value !== 'object') return NO_LOCKOUTS;
  const { v, by } = value as { readonly v?: unknown; readonly by?: unknown };
  if (v !== 2 || by === null || typeof by !== 'object' || Array.isArray(by)) return NO_LOCKOUTS;
  const entries = Object.entries(by).map(([subject, s]) => [subject, asPinLockout(s)] as const);
  return { v: 2, by: Object.fromEntries(entries.filter(([, s]) => !isCleanLockout(s))) };
}

/** Reads the stored map; anything else, the earlier shapes included, is no lockouts. */
export function parsePinLockouts(raw: string | null): PinLockoutBook {
  if (!raw) return NO_LOCKOUTS;
  try {
    return readBook(JSON.parse(raw) as unknown);
  } catch {
    return NO_LOCKOUTS;
  }
}
