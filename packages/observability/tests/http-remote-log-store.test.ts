/**
 * HttpRemoteLogStore tests.
 *
 * Uses a mock fetch (globalThis.fetch) to verify HTTP calls.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpRemoteLogStore } from '../src/http-remote-log-store.js';
import type { ErrorLogEntry } from '../src/error-log.js';

const TEST_ENTRY: ErrorLogEntry = {
  id: 'err-1',
  timestamp: '2026-05-16T14:00:00.000Z',
  source: 'use-case',
  errorName: 'ZodError',
  errorMessage: 'monto must be > 0',
  errorStack: 'at validate (zod.js:123)',
  userId: null,
  deviceId: 'dev-001',
  businessId: 'biz-01',
  context: { concepto: 'Private data', amount: 100 },
};

describe('HttpRemoteLogStore', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it('sends error batch to /errors endpoint', async () => {
    const store = new HttpRemoteLogStore({ baseUrl: 'https://api.test.com' });
    await store.sendErrorBatch([TEST_ENTRY]);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.test.com/errors');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(opts.body);
    // Stack traces should be removed
    expect(body.entries[0].errorStack).toBeUndefined();
    // PII should be scrubbed
    expect(body.entries[0].context.concepto).toBe('[REDACTED]');
    // Non-PII should be preserved
    expect(body.entries[0].context.amount).toBe(100);
  });

  it('sends bug report to /bug-reports endpoint', async () => {
    const store = new HttpRemoteLogStore({ baseUrl: 'https://api.test.com/' });
    await store.sendBugReport({
      description: 'Something went wrong',
      deviceId: 'dev-001',
      businessId: 'biz-01',
      userId: null,
      snapshot: { auditEvents: [], errors: [] },
      submittedAt: '2026-05-16T14:00:00.000Z',
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0]!;
    // Should strip trailing slash from baseUrl
    expect(url).toBe('https://api.test.com/bug-reports');
  });

  it('includes Authorization header when apiKey is set', async () => {
    const store = new HttpRemoteLogStore({
      baseUrl: 'https://api.test.com',
      apiKey: 'my-secret-key',
    });
    await store.sendErrorBatch([TEST_ENTRY]);

    const [, opts] = fetchMock.mock.calls[0]!;
    expect(opts.headers['Authorization']).toBe('Bearer my-secret-key');
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    const store = new HttpRemoteLogStore({ baseUrl: 'https://api.test.com' });
    await expect(store.sendErrorBatch([TEST_ENTRY])).rejects.toThrow(/500/);
  });
});
