/**
 * Wrong-PIN cooldown (A-05): after 5 failed PINs the device refuses PIN
 * attempts for 30 s. Device-wide, not per operator — otherwise tapping a
 * different avatar would reset the counter. Pure; persistence lives in
 * `use-quick-switch-auth`.
 */

export const MAX_PIN_FAILURES = 5;
export const PIN_COOLDOWN_MS = 30_000;

export interface PinLockoutState {
  readonly failures: number;
  /** ISO time until which attempts are refused, or null. */
  readonly lockedUntil: string | null;
}

export const NO_LOCKOUT: PinLockoutState = { failures: 0, lockedUntil: null };

export function remainingLockMs(state: PinLockoutState, now: Date): number {
  if (!state.lockedUntil) return 0;
  return Math.max(0, new Date(state.lockedUntil).getTime() - now.getTime());
}

export function recordPinFailure(state: PinLockoutState, now: Date): PinLockoutState {
  const failures = state.failures + 1;
  if (failures < MAX_PIN_FAILURES) return { failures, lockedUntil: null };
  return { failures: 0, lockedUntil: new Date(now.getTime() + PIN_COOLDOWN_MS).toISOString() };
}

export function parsePinLockout(raw: string | null): PinLockoutState {
  if (!raw) return NO_LOCKOUT;
  try {
    const v = JSON.parse(raw) as Partial<PinLockoutState>;
    const failures = typeof v.failures === 'number' && v.failures >= 0 ? v.failures : 0;
    const lockedUntil = typeof v.lockedUntil === 'string' ? v.lockedUntil : null;
    return { failures, lockedUntil };
  } catch {
    return NO_LOCKOUT;
  }
}
