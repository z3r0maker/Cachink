import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * `onRequestError` (B-18, P-48): what no route or action caught is reported,
 * and the event is kept with the session whose request failed, so a report
 * from Ayuda can name it.
 */
const reportError = vi.fn();
const keepLastErrorFor = vi.fn();
const tokenFromCookieHeader = vi.fn();

vi.mock('../src/server/observability/report', () => ({ reportError }));
vi.mock('../src/server/observability/last-error', () => ({
  keepLastErrorFor,
  tokenFromCookieHeader,
}));

const { onRequestError } = await import('../src/instrumentation');

type Args = Parameters<typeof onRequestError>;
const REQUEST = {
  path: '/movimientos',
  method: 'GET',
  headers: { cookie: 'xg_session=the-token' },
} as Args[1];
const CONTEXT = { routeType: 'render', routePath: '/(portal)/movimientos' } as Args[2];
const EVENT = 'a3f1c2d4e5b60718293a4b5c6d7e8f90';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  tokenFromCookieHeader.mockReturnValue('the-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('onRequestError', () => {
  it('reports the error and keeps its event with the request’s session', async () => {
    const error = new Error('render failed');
    reportError.mockReturnValue(EVENT);
    await onRequestError(error, REQUEST, CONTEXT);
    assert.deepEqual(reportError.mock.calls, [
      [error, { endpoint: 'render:/(portal)/movimientos' }],
    ]);
    assert.deepEqual(tokenFromCookieHeader.mock.calls, [['xg_session=the-token']]);
    assert.deepEqual(keepLastErrorFor.mock.calls, [['the-token', EVENT]]);
  });

  it('keeps nothing when Sentry named no event', async () => {
    reportError.mockReturnValue(undefined);
    await onRequestError(new Error('x'), REQUEST, CONTEXT);
    assert.equal(reportError.mock.calls.length, 1);
    assert.equal(keepLastErrorFor.mock.calls.length, 0);
  });

  it('a request without a session still reports; there is nobody to keep it for', async () => {
    reportError.mockReturnValue(EVENT);
    tokenFromCookieHeader.mockReturnValue(null);
    await onRequestError(new Error('x'), { ...REQUEST, headers: {} }, CONTEXT);
    assert.deepEqual(keepLastErrorFor.mock.calls, [[null, EVENT]]);
  });

  it('does nothing outside the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    await onRequestError(new Error('x'), REQUEST, CONTEXT);
    assert.equal(reportError.mock.calls.length, 0);
    assert.equal(keepLastErrorFor.mock.calls.length, 0);
  });
});
