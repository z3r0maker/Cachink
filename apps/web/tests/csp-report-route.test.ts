import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';

/**
 * `POST /api/csp-report` (SEC-WEB-01): the browser's CSP-violation firehose
 * while the policy is report-only. One structured line per violation — at
 * most ten, at most 16 KB — and always 204, because a reporting endpoint
 * that errors teaches the browser nothing.
 */

const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

vi.mock('../src/server/security/csp-report', () => ({
  parseViolations: (body: unknown) => {
    const report = (body as { 'csp-report'?: { violaciones?: unknown[] } })['csp-report'];
    return Array.isArray(report?.violaciones) ? report.violaciones.map((v) => ({ v })) : [];
  },
}));

const { POST } = await import('../src/app/api/csp-report/route');

const pedido = (cuerpo: unknown, texto?: string) =>
  new Request('https://app.xangarro.mx/api/csp-report', {
    method: 'POST',
    body: texto ?? JSON.stringify(cuerpo),
  });

afterEach(() => log.mockClear());

describe('POST /api/csp-report', () => {
  it('one structured line per violation, then 204', async () => {
    const res = await POST(
      pedido({
        'csp-report': { violaciones: [{ a: 1 }, { a: 2 }, { a: 3 }] },
      }),
    );
    assert.equal(res.status, 204);
    assert.equal(log.mock.calls.length, 3);
    const primera = JSON.parse(log.mock.calls[0]?.[0] as string) as { evt: string };
    assert.equal(primera.evt, 'csp');
  });

  it('a body that is not JSON is swallowed — 204, no lines', async () => {
    const res = await POST(pedido(null, 'esto no es json'));
    assert.equal(res.status, 204);
    assert.equal(log.mock.calls.length, 0);
  });

  it('a body without a report is swallowed too', async () => {
    const res = await POST(pedido({ otra: 'cosa' }));
    assert.equal(res.status, 204);
    assert.equal(log.mock.calls.length, 0);
  });

  it('at most ten violations are logged', async () => {
    const res = await POST(
      pedido({ 'csp-report': { violaciones: Array.from({ length: 25 }, (_, i) => ({ i })) } }),
    );
    assert.equal(res.status, 204);
    assert.equal(log.mock.calls.length, 10);
  });
});
