/**
 * Wrong-NIP lockout (A-05, audit F-08): five wrong NIPs lock that NIP, and
 * each consecutive lockout is longer. This is the ladder for one subject,
 * the person whose NIP is being checked.
 *
 * It is per subject, not device-wide. A device-wide count is reset by
 * anyone who knows their own NIP: four guesses at the supervisor's, one
 * sign-in as oneself, four more, for ever, and the ladder never reaches the
 * coworker it is there for. It also stops the whole register when one NIP
 * is hammered. Counting by the NIP's owner closes both: only that person's
 * right NIP clears their count, and only they are locked. Tapping another
 * avatar starts on that avatar's own count, it does not reset this one.
 *
 * Pure: the clock comes in as an argument; what is stored is `book.ts` and
 * persistence is the caller's (`guard.ts`).
 */

export const MAX_PIN_FAILURES = 5;

/** How long each consecutive lockout lasts; the last rung repeats. */
export const PIN_LOCK_LADDER_MS = [30_000, 60_000, 300_000, 900_000, 3_600_000] as const;

export interface PinLockoutState {
  /** Wrong NIPs since the last lockout or the last right NIP. */
  readonly failures: number;
  /** ISO time until which attempts are refused, or null. */
  readonly lockedUntil: string | null;
  /**
   * Lockouts started since the last right NIP: the rung the next one takes.
   * It outlives the cooldown and a restart; only a right NIP clears it.
   */
  readonly level: number;
}

export const NO_LOCKOUT: PinLockoutState = { failures: 0, lockedUntil: null, level: 0 };

/** Nothing counted, nothing served, nothing running: not worth storing. */
export const isCleanLockout = (s: PinLockoutState): boolean =>
  s.failures === 0 && s.level === 0 && s.lockedUntil === null;

function rungMs(index: number): number {
  const rung = Math.min(Math.max(index, 0), PIN_LOCK_LADDER_MS.length - 1);
  return PIN_LOCK_LADDER_MS[rung] ?? PIN_LOCK_LADDER_MS[4];
}

/**
 * Milliseconds still to wait. Never more than the rung in force: a stored
 * time far ahead (the clock ran fast when the lock started) cannot hold a
 * NIP longer than the lockout it earned.
 */
export function remainingLockMs(state: PinLockoutState, now: Date): number {
  if (!state.lockedUntil) return 0;
  const until = Date.parse(state.lockedUntil);
  if (!Number.isFinite(until)) return 0;
  return Math.min(Math.max(0, until - now.getTime()), rungMs(state.level - 1));
}

export function recordPinFailure(state: PinLockoutState, now: Date): PinLockoutState {
  const failures = state.failures + 1;
  if (failures < MAX_PIN_FAILURES) return { ...state, failures };
  return {
    failures: 0,
    lockedUntil: new Date(now.getTime() + rungMs(state.level)).toISOString(),
    level: state.level + 1,
  };
}

const count = (v: unknown): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0;

/** One stored entry, read defensively: anything unreadable counts as zero. */
export function asPinLockout(value: unknown): PinLockoutState {
  if (value === null || typeof value !== 'object') return NO_LOCKOUT;
  const v = value as Partial<Record<keyof PinLockoutState, unknown>>;
  return {
    failures: count(v.failures),
    lockedUntil: typeof v.lockedUntil === 'string' ? v.lockedUntil : null,
    level: count(v.level),
  };
}

/** «Demasiados intentos. Espera 30 s.»: seconds under a minute, minutes from there. */
export function fraseEsperaNip(lockedMs: number): string {
  if (lockedMs < 60_000) return `Demasiados intentos. Espera ${Math.ceil(lockedMs / 1000)} s.`;
  return `Demasiados intentos. Espera ${Math.ceil(lockedMs / 60_000)} min.`;
}
