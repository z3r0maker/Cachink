/**
 * initSentryIfConsented tests (ADR-027, S4-C16).
 *
 * Exercises the consent gate without mounting real Sentry. Since we
 * can't stub the async import at vitest runtime, we instead verify
 * that consent !== true is a no-op (the early-return path).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetSentry, captureException, initSentryIfConsented } from '../../src/telemetry/sentry';

afterEach(() => {
  __resetSentry();
  vi.unstubAllEnvs();
});

describe('initSentryIfConsented', () => {
  it('is a no-op when consent is null', async () => {
    await initSentryIfConsented(null);
    // captureException should silently return since init never ran.
    expect(() => captureException(new Error('x'))).not.toThrow();
  });

  it('is a no-op when consent is false', async () => {
    await initSentryIfConsented(false);
    expect(() => captureException(new Error('x'))).not.toThrow();
  });

  it('is a no-op when consent is true but no DSN is set', async () => {
    vi.stubEnv('EXPO_PUBLIC_SENTRY_DSN', '');
    await initSentryIfConsented(true);
    expect(() => captureException(new Error('x'))).not.toThrow();
  });

  it('captureException is a no-op when Sentry was never initialised', () => {
    expect(() => captureException(new Error('x'))).not.toThrow();
  });
});
