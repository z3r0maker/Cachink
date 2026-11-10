import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

import { ErrorEnvelopeSchema, MAX_BUG_REPORT_BYTES } from '@xangarro/contracts';

/**
 * `POST /api/v1/support/bug-report` (N-81, contract §9), the route's own part:
 * it goes through `deviceRoute` like every phone endpoint, hands the handler
 * the caller the token named, and turns each outcome into the contract's
 * answer. The rules themselves are `bug-report.test.ts`'s.
 */
const route = vi.fn();
const fileBugReport = vi.fn();

vi.mock('../src/server/api/device-route', () => ({
  deviceRoute: (
    name: string,
    request: Request,
    handler: (caller: unknown) => Promise<{ response: Response }>,
    internal: string,
  ) => route(name, request, handler, internal),
}));
vi.mock('../src/server/support/bug-report', () => ({
  fileBugReport: (...args: unknown[]) => fileBugReport(...args),
}));

const { POST } = await import('../src/app/api/v1/support/bug-report/route');

const CALLER = { deviceId: 'dev-1', businessId: 'biz-1' };
const BODY = JSON.stringify({ description: 'x', submittedAt: '2026-11-10T02:15:00.000Z' });

const request = (headers: Record<string, string> = {}) =>
  new Request('https://app.xangarro.mx/api/v1/support/bug-report', {
    method: 'POST',
    body: BODY,
    headers,
  });

beforeEach(() => {
  vi.clearAllMocks();
  route.mockImplementation(
    async (_n: string, _r: Request, h: (c: unknown) => Promise<{ response: Response }>) =>
      (await h(CALLER)).response,
  );
});

describe('POST /api/v1/support/bug-report', () => {
  it('is a device route, and files with the caller the token named', async () => {
    fileBugReport.mockResolvedValue({ kind: 'accepted' });
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { accepted: true });
    assert.equal(route.mock.calls[0]?.[0], 'support/bug-report');
    const [caller, raw, deps] = fileBugReport.mock.calls[0] ?? [];
    assert.deepEqual(caller, CALLER);
    assert.equal(raw, BODY);
    assert.equal(typeof (deps as { take: unknown }).take, 'function');
    assert.equal(typeof (deps as { inbox: { file: unknown } }).inbox.file, 'function');
  });

  it('answers a body that is not a report with a whole-request VALIDATION', async () => {
    fileBugReport.mockResolvedValue({ kind: 'invalid', reason: 'a report needs a description' });
    const response = await POST(request());
    assert.equal(response.status, 400);
    assert.equal(ErrorEnvelopeSchema.parse(await response.json()).error.code, 'VALIDATION');
  });

  it('answers a spent limit with RATE_LIMITED and when to come back', async () => {
    fileBugReport.mockResolvedValue({ kind: 'limited', retryAfter: 3600 });
    const response = await POST(request());
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '3600');
    assert.equal(ErrorEnvelopeSchema.parse(await response.json()).error.code, 'RATE_LIMITED');
  });

  it('refuses a body that declares itself too large, without reading it', async () => {
    const response = await POST(request({ 'content-length': String(MAX_BUG_REPORT_BYTES + 1) }));
    assert.equal(response.status, 400);
    assert.equal(fileBugReport.mock.calls.length, 0);
  });

  it('lets a handler failure reach deviceRoute, which reports it and answers INTERNAL', async () => {
    fileBugReport.mockRejectedValue(new Error('inbox is down'));
    await assert.rejects(POST(request()), /inbox is down/);
  });
});
