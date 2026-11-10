/**
 * The one door every NIP check on a device goes through (audit F-08): the
 * sign-in, the lock screen, a cancellation. The count belongs to the
 * subject, the user whose NIP is checked: a wrong NIP for them on any path
 * counts toward their lockout, and while it runs every path that checks
 * their NIP is refused before the hash is looked at. Nobody else is locked,
 * and nobody else's right NIP clears it. Storage and the clock are ports,
 * so the phone and the web caja bind their own app_config and the same
 * anchored clock.
 */

import { PIN_LOCKOUT_KEY, lockoutOf, parsePinLockouts, withLockout } from './book';
import { NO_LOCKOUT, fraseEsperaNip, recordPinFailure, remainingLockMs } from './lockout';

/** Where the lockouts live (app_config, under `PIN_LOCKOUT_KEY`). */
export interface NipLockoutStore {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}

export interface NipGuardDeps {
  readonly store: NipLockoutStore;
  /** The anchored clock, `max(device clock, last server time)`. */
  readonly now: () => Promise<Date>;
}

/** A key/value table, as app_config is on the phone and in the web caja. */
export interface NipConfigTable {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

/** The guard over a device's app_config and its anchored clock. */
export function nipGuardOver(config: NipConfigTable, now: () => Promise<Date>): NipGuardDeps {
  return {
    store: {
      read: () => config.get(PIN_LOCKOUT_KEY),
      write: (value) => config.set(PIN_LOCKOUT_KEY, value),
    },
    now,
  };
}

/** What a check answers: the value a right NIP unlocks, or that it was wrong. */
export type NipCheck<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

export type NipAttempt<T> =
  | { readonly status: 'ok'; readonly value: T }
  /** A wrong NIP, counted. `lockedMs` is above zero when it started a lockout. */
  | { readonly status: 'wrong'; readonly lockedMs: number }
  /** Refused without checking: the subject's lockout is running. */
  | { readonly status: 'locked'; readonly lockedMs: number };

/**
 * For a path that answers by throwing (the web caja's Worker): a NIP check
 * refused because a lockout is running. Its message says how long remains.
 */
export class NipBloqueadoError extends Error {
  readonly code = 'NIP_BLOQUEADO' as const;
  readonly lockedMs: number;

  constructor(lockedMs: number) {
    super(fraseEsperaNip(lockedMs));
    this.lockedMs = lockedMs;
  }
}

/**
 * Runs `check` on `subject`'s NIP unless their lockout is running, and
 * records what it answers against them alone. `subject` is the id of the
 * user whose NIP is checked, never of whoever is at the keypad.
 *
 * A check that throws (no such user, no permission) is neither a right NIP
 * nor a wrong one: the error passes through and the count stays as it was.
 */
export async function attemptNip<T>(
  deps: NipGuardDeps,
  subject: string,
  check: () => Promise<NipCheck<T>>,
): Promise<NipAttempt<T>> {
  const before = lockoutOf(parsePinLockouts(await deps.store.read()), subject);
  const lockedMs = remainingLockMs(before, await deps.now());
  if (lockedMs > 0) return { status: 'locked', lockedMs };
  const answer = await check();
  // Read again: the hash took a while, and someone else's entry may have changed.
  const book = parsePinLockouts(await deps.store.read());
  if (answer.ok) {
    const cleared = withLockout(book, subject, NO_LOCKOUT);
    if (Object.hasOwn(book.by, subject)) await deps.store.write(JSON.stringify(cleared));
    return { status: 'ok', value: answer.value };
  }
  const now = await deps.now();
  const next = recordPinFailure(lockoutOf(book, subject), now);
  await deps.store.write(JSON.stringify(withLockout(book, subject, next)));
  return { status: 'wrong', lockedMs: remainingLockMs(next, now) };
}
