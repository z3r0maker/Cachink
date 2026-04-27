/**
 * Sentry init + captureException helpers (ADR-027, S4-C16).
 *
 * No-op when consent !== true. The DSN is read from
 * `EXPO_PUBLIC_SENTRY_DSN`; empty / missing → no init.
 *
 * The import of `@sentry/browser` is dynamic so the bundle stays lean
 * when the user hasn't opted in (matches ADR-025's dynamic-import
 * pattern for heavy deps).
 */

import type { ErrorInfo } from 'react';
import type * as SentryBrowserModule from '@sentry/browser';
import { scrubPii } from './pii-scrubber';

type SentryBrowser = typeof SentryBrowserModule;

let _sentry: SentryBrowser | null = null;
let _initialised = false;

function readDsn(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (typeof dsn === 'string' && dsn.length > 0) return dsn;
  }
  return undefined;
}

export async function initSentryIfConsented(consent: boolean | null): Promise<void> {
  if (consent !== true) return;
  if (_initialised) return;
  const dsn = readDsn();
  if (!dsn) return;
  _sentry = await import('@sentry/browser');
  _sentry.init({
    dsn,
    beforeSend(event) {
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
