/**
 * `useNotificationScheduler` — singleton-selecting hook (ADR-026, S4-C10).
 *
 * Returns the right `NotificationScheduler` implementation for the
 * current platform. `Platform.OS` drives the choice: on mobile
 * (ios/android) we return an `ExpoNotificationScheduler`; on web / desktop
 * (Tauri WebView) we return a `TauriNotificationScheduler`.
 *
 * Tests can override the selection via the `testScheduler` parameter —
 * the hook prefers it when provided so unit tests never call Expo /
 * Tauri primitives.
 */

import { useMemo } from 'react';
import {
  InMemoryNotificationScheduler,
  type NotificationScheduler,
} from './notification-scheduler.shared';

let _singleton: NotificationScheduler | null = null;

/**
 * Platform detection without importing `react-native` (which breaks
 * node-based vitest runs). React Native sets `navigator.product` to
 * `'ReactNative'`; Tauri WebView + Node + jsdom all leave the
 * product untouched or unset. See
 * https://reactnative.dev/docs/platform-specific-code.
 */
function isReactNative(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (navigator as { product?: string }).product === 'ReactNative'
  );
}

async function defaultScheduler(): Promise<NotificationScheduler> {
  if (_singleton) return _singleton;
  if (isReactNative()) {
    const mod = await import('./notification-scheduler.native');
    _singleton = new mod.ExpoNotificationScheduler();
  } else {
    const mod = await import('./notification-scheduler.web');
    _singleton = new mod.TauriNotificationScheduler();
  }
  return _singleton;
}

/**
 * Returns a NotificationScheduler synchronously. The hook lazily
 * creates a singleton on first access; call sites typically read the
 * scheduler in a `useEffect` so the async import is awaited before
 * use.
 *
 * When `override` is provided (tests) the hook returns it directly —
 * that impl is NOT memoised into the singleton.
 */
export function useNotificationScheduler(override?: NotificationScheduler): NotificationScheduler {
  return useMemo<NotificationScheduler>(() => {
    if (override !== undefined) return override;
    if (_singleton) return _singleton;
    // Return a transient in-memory scheduler until the async singleton
    // resolves. Callers that do `useEffect(() => scheduler.schedule…)`
    // will see the real one once it's loaded on subsequent renders.
    _singleton = new InMemoryNotificationScheduler();
    void defaultScheduler();
    return _singleton;
  }, [override]);
}

/** Exposed for test harness cleanup. */
export function __resetSchedulerSingleton(): void {
  _singleton = null;
}
