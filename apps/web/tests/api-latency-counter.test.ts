import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * `countApiLatency` sits on the hottest path the product has — every push and
 * every pull from every device calls it (N-07, `deviceRoute`). Its whole
 * contract is about what it must *not* do: never throw at its caller, never
 * make the caller wait, and never hand the database an endpoint that would
 * raise. A statistic that can fail a shopkeeper's sync is worse than no
 * statistic.
 *
 * None of that is observable from the outside, which is why it is tested here
 * rather than inferred from the one line in `deviceRoute` that calls it.
 */
vi.mock('@xangarro/data-pg', () => ({
  API_LATENCY_ENDPOINTS: ['sync/push', 'sync/pull', 'entitlement', 'comprobante'],
  recordApiLatency: vi.fn(async () => undefined),
}));

vi.mock('../src/server/db', () => ({ db: vi.fn(() => ({ marker: 'db' })) }));

vi.mock('../src/server/observability/report', () => ({ reportError: vi.fn() }));

async function load() {
  const dataPg = await import('@xangarro/data-pg');
  const report = await import('../src/server/observability/report');
  const mod = await import('../src/server/observability/latency');
  return {
    countApiLatency: mod.countApiLatency,
    recordApiLatency: vi.mocked(dataPg.recordApiLatency),
    reportError: vi.mocked(report.reportError),
  };
}

/** The call is deliberately not awaited, so its promise settles a tick later. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('countApiLatency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('files a known endpoint with its milliseconds', async () => {
    const { countApiLatency, recordApiLatency } = await load();
    countApiLatency('sync/push', 137);
    await settle();

    assert.equal(recordApiLatency.mock.calls.length, 1);
    const [, endpoint, ms] = recordApiLatency.mock.calls[0] ?? [];
    assert.equal(endpoint, 'sync/push');
    assert.equal(ms, 137);
  });

  it('ignores an endpoint the histogram does not know, rather than raising one', async () => {
    // The database function raises on an unknown endpoint — that is what keeps
    // the table bounded. Reaching it from here would turn a typo into an error
    // report on every single call.
    const { countApiLatency, recordApiLatency, reportError } = await load();
    countApiLatency('sync/nope', 40);
    countApiLatency('', 40);
    await settle();

    assert.equal(recordApiLatency.mock.calls.length, 0);
    assert.equal(reportError.mock.calls.length, 0, 'an unknown endpoint is skipped, not reported');
  });

  it('returns before the write settles, so a slow counter is not the latency it measures', async () => {
    const { countApiLatency, recordApiLatency } = await load();
    let resolveWrite: (() => void) | undefined;
    recordApiLatency.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );

    countApiLatency('sync/pull', 12);
    // Still pending: the function has already returned to its caller.
    assert.equal(typeof resolveWrite, 'function');
    resolveWrite?.();
    await settle();
  });

  it('swallows a failed write and reports it, so the sync still answers', async () => {
    const { countApiLatency, recordApiLatency, reportError } = await load();
    const boom = new Error('connection refused');
    recordApiLatency.mockRejectedValueOnce(boom);

    // The throw is the point: an unhandled rejection here would take the
    // process down in Node, and `deviceRoute` does not await this.
    assert.doesNotThrow(() => countApiLatency('entitlement', 9));
    await settle();

    assert.equal(reportError.mock.calls.length, 1);
    const [error, scope] = reportError.mock.calls[0] ?? [];
    assert.equal(error, boom);
    assert.deepEqual(scope, { endpoint: 'latency/entitlement' });
  });
});
