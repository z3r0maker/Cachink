import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * The nightly usage cron route (N-02/N-03): the shared guard lets the
 * authed run through and reports each failed business; the run's own error
 * is reported and answered 500 so Vercel's cron log shows it. The guard's
 * refusal paths live in `tests/` beside `cron.ts` itself.
 */

const runUsageRecompute = vi.fn();
const reportError = vi.fn();

vi.mock('../src/server/usage/live', () => ({
  runUsageRecompute: (...a: unknown[]) => runUsageRecompute(...a),
}));
vi.mock('../src/server/observability/report', () => ({ reportError }));

const { GET } = await import('../src/app/api/cron/usage/route');

const SECRETO = 'el-secreto-del-cron';
const pedido = () =>
  new Request('https://app.xangarro.mx/api/cron/usage', {
    headers: { authorization: `Bearer ${SECRETO}` },
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRETO;
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe('GET /api/cron/usage', () => {
  it('the authed run returns its result', async () => {
    runUsageRecompute.mockResolvedValue({ failures: [], businesses: 12 });
    const res = await GET(pedido());
    assert.equal(res.status, 200);
    const body = (await res.json()) as { businesses?: number };
    assert.equal(body.businesses, 12);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a business whose notices failed is reported, once each', async () => {
    runUsageRecompute.mockResolvedValue({
      failures: [
        { businessId: 'b-1', error: 'resend 500' },
        { businessId: 'b-2', error: 'resend 500' },
      ],
    });
    const res = await GET(pedido());
    assert.equal(res.status, 200);
    assert.equal(reportError.mock.calls.length, 2);
    assert.deepEqual(reportError.mock.calls[0]?.[1], {
      endpoint: 'cron/usage',
      businessId: 'b-1',
    });
  });

  it('a run that throws is reported and answered 500', async () => {
    runUsageRecompute.mockRejectedValue(new Error('metering down'));
    const res = await GET(pedido());
    assert.equal(res.status, 500);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, 'usage_failed');
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('without the bearer, the guard refuses before anything runs', async () => {
    const res = await GET(new Request('https://app.xangarro.mx/api/cron/usage', { headers: {} }));
    assert.equal(res.status, 401);
    assert.equal(runUsageRecompute.mock.calls.length, 0);
  });
});
