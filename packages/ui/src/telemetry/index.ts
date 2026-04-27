/**
 * Public surface of `@cachink/ui/telemetry` (ADR-027).
 */
export { scrubPii, PII_FIELDS } from './pii-scrubber';
export { initSentryIfConsented, captureException, __resetSentry } from './sentry';
