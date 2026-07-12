/**
 * Sentry init + captureException for React Native (ADR-025, ADR-027).
 *
 * Uses `@sentry/react-native` instead of `@sentry/browser`.
 * Platform-split module: bundler resolves `.native.ts` on mobile,
 * `.ts` on desktop (Metro convention).
 *
 * Deferred init: only initializes after AppConfig hydration and only
 * when consent === true and EXPO_PUBLIC_SENTRY_DSN is set.
 */

import type { ErrorInfo } from 'react';
import { scrubPii } from './pii-scrubber';

type SentryModule = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (error: Error, opts?: Record<string, unknown>) => void;
  close: () => Promise<void>;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
};

let _sentry: SentryModule | null = null;
let _initialised = false;

function readDsn(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (typeof dsn === 'string' && dsn.length > 0) return dsn;
  }
  return undefined;
}

export async function initSentryIfConsented(consent: boolean | null): Promise<void> {
  // Toggle-off: close Sentry if it was previously initialized
  if (consent !== true && _initialised && _sentry) {
    try {
      await _sentry.close();
    } catch { /* closing failed — non-critical */ }
    _initialised = false;
    _sentry = null;
    return;
  }

  if (consent !== true) return;
  if (_initialised) return;
  const dsn = readDsn();
  if (!dsn) return;

  _sentry = await import('@sentry/react-native') as unknown as SentryModule;
  _sentry.init({
    dsn,
    beforeSend(event: unknown) {
      return scrubPii(event as never);
    },
  });
  _initialised = true;
}

export function captureException(error: Error, info?: ErrorInfo): void {
  if (!_initialised || !_sentry) return;
  _sentry.captureException(
    error,
    info ? { extra: { componentStack: info.componentStack } } : undefined,
  );
}

/** Test-only reset. */
export function __resetSentry(): void {
  _sentry = null;
  _initialised = false;
}
