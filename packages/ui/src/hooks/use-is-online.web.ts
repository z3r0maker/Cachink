/**
 * `useIsOnline` — Tauri / web variant (ADR-039).
 *
 * Subscribes to `navigator.onLine` + `'online'` / `'offline'` events.
 * Returns `true` defensively when `navigator` is unavailable
 * (server-side rendering or very old WebView).
 */

import { useEffect, useState } from 'react';

function readOnline(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') {
    return true;
  }
  return navigator.onLine;
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() => readOnline());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = (): void => setOnline(true);
    const handleOffline = (): void => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Re-sync on mount in case the value changed between hydration and
    // the first effect tick.
    setOnline(readOnline());
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return online;
}
