'use client';

/**
 * Registers the offline-page service worker (N-23) on the Director surface.
 *
 * Production only — a service worker in `next dev` caches across reloads and
 * fights the very thing a developer is iterating on. The worker itself guards
 * `/operador` (ADR-071: the register is never replaced), so the only thing
 * this guard adds is not installing the worker for a session that lives on
 * the register. Fails silently by design: no SW, no offline page — never a
 * portal error over a progressive enhancement.
 */

import { useEffect } from 'react';

export function OfflineRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (window.location.pathname.startsWith('/operador')) return;
    void navigator.serviceWorker.register('/sw.js', { type: 'module' }).catch(() => undefined);
  }, []);
  return null;
}
