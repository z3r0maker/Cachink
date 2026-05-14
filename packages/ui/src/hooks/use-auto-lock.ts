/**
 * useAutoLock — automatically locks the screen after inactivity.
 *
 * Configurable timeout (default 5 minutes). When the timeout fires,
 * sets `userId: null` in Zustand → QuickSwitchScreen renders.
 *
 * IMPORTANT: auto-lock does NOT close Caja turn — only locks screen.
 *
 * Options: 1 min, 2 min, 5 min, 10 min, 30 min, Never.
 *
 * The hook returns a `resetActivity` callback. The companion
 * `ActivityTracker` wraps children in a `View` using
 * `onStartShouldSetResponderCapture` to reset the timer on
 * ANY touch — scroll, tap, swipe, keyboard dismiss, etc.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useUserId, useSetUserId } from '../app-config/use-app-config';

/** Timeout options in milliseconds. `0` means never. */
export const AUTO_LOCK_OPTIONS = [
  { labelKey: 'autoLock.1min', value: 60_000 },
  { labelKey: 'autoLock.2min', value: 120_000 },
  { labelKey: 'autoLock.5min', value: 300_000 },
  { labelKey: 'autoLock.10min', value: 600_000 },
  { labelKey: 'autoLock.30min', value: 1_800_000 },
  { labelKey: 'autoLock.never', value: 0 },
] as const;

export const DEFAULT_AUTO_LOCK_TIMEOUT = 300_000; // 5 minutes

export interface UseAutoLockResult {
  /** Call on any user activity to postpone the lock timer. */
  readonly resetActivity: () => void;
}

/**
 * Builds the AppState change handler outside the hook to reduce cognitive
 * complexity. Uses early returns instead of nested if/else to keep nesting shallow.
 */
function makeAppStateHandler(
  backgroundAtRef: { current: number | null },
  lastActivityRef: { current: number },
  timeoutMs: number,
  lock: () => void,
  clearTimer: () => void,
  startTimer: () => void,
) {
  return function handleAppState(state: AppStateStatus): void {
    if (state === 'background' || state === 'inactive') {
      backgroundAtRef.current = Date.now();
      clearTimer();
      return;
    }
    if (state !== 'active') return;
    const bgAt = backgroundAtRef.current;
    backgroundAtRef.current = null;
    if (bgAt === null) return;
    if (Date.now() - bgAt >= timeoutMs) {
      lock();
      return;
    }
    // Also check last activity — if the user was idle before backgrounding,
    // account for that time too.
    if (Date.now() - lastActivityRef.current >= timeoutMs) {
      lock();
      return;
    }
    startTimer();
  };
}

function clearTimerRef(ref: { current: ReturnType<typeof setTimeout> | null }): void {
  if (ref.current !== null) clearTimeout(ref.current);
  ref.current = null;
}

export function useAutoLock(timeoutMs: number): UseAutoLockResult {
  const userId = useUserId();
  const setUserId = useSetUserId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundAtRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const lock = useCallback(() => void (userId !== null && setUserId(null)), [userId, setUserId]);
  const clearTimer = useCallback(() => clearTimerRef(timerRef), []);
  const startTimer = useCallback(() => {
    clearTimer();
    if (timeoutMs > 0 && userId !== null) timerRef.current = setTimeout(lock, timeoutMs);
  }, [timeoutMs, userId, lock, clearTimer]);

  /** Reset the inactivity timer — call on any touch / interaction. */
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (timeoutMs <= 0 || userId === null) return;
    const handler = makeAppStateHandler(
      backgroundAtRef,
      lastActivityRef,
      timeoutMs,
      lock,
      clearTimer,
      startTimer,
    );
    const sub = AppState.addEventListener('change', handler);
    startTimer();
    return () => {
      sub.remove();
      clearTimer();
    };
  }, [timeoutMs, userId, lock, clearTimer, startTimer]);

  return { resetActivity };
}
