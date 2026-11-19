import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * `GET /api/gastos/<id>/comprobante` (ADR-149, M-18): a gasto's receipt photo
 * for the signed-in business. The newest row wins inside the tenant
 * transaction (`latestExpenseReceipt`, proved against Postgres in data-pg);
 * this covers the gate and the answer: 401 without a session, 404 for a
 * malformed id or a gasto with no receipt, the WebP with a private,
 * revalidated cache and an ETag of the bytes' hash, and 304 when the browser
 * already has them.
 */
const readSession = vi.fn();
const latestExpenseReceipt = vi.fn();
const withTenant = vi.fn();

vi.mock('../src/server/session', () => ({ readSession }));
vi.mock('../src/server/db', () => ({
  withTenant: (b: string, fn: (tx: unknown) => unknown) => withTenant(b, fn),
}));
vi.mock('@xangarro/data-pg', () => ({
  latestExpenseReceipt: (tx: unknown, id: string) => latestExpenseReceipt(tx, id),
  receiptsOfGastos: () => Promise.resolve([]),
}));

const { GET } = await import('../src/app/api/gastos/[gastoId]/comprobante/route');

const GASTO = '01HZ8XQN9GZJXV8AKQ5X0GST01';
const WEBP = Buffer.from('RIFF\u0010\u0000\u0000\u0000WEBPVP8 ticket', 'latin1');
const HASH = 'a'.repeat(64);

const get = (gastoId: string, headers: Record<string, string> = {}) =>
  GET(new Request(`http://x/api/gastos/${gastoId}/comprobante`, { headers }), {
    params: Promise.resolve({ gastoId }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  readSession.mockResolvedValue({ business_id: 'biz-1' });
  withTenant.mockImplementation(async (_b: string, fn: (tx: unknown) => unknown) => fn({}));
  latestExpenseReceipt.mockResolvedValue({
    id: 'R1',
    mime: 'image/webp',
    bytes: WEBP.toString('base64'),
    hash: HASH,
  });
});

describe('the gasto receipt route', () => {
  it('answers the newest receipt as WebP, read inside the business’s tenant', async () => {
    const res = await get(GASTO);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/webp');
    assert.equal(res.headers.get('Content-Length'), String(WEBP.byteLength));
    assert.equal(res.headers.get('Cache-Control'), 'private, no-cache');
    assert.equal(res.headers.get('ETag'), `"${HASH}"`);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), WEBP);
    assert.equal(withTenant.mock.calls[0]?.[0], 'biz-1');
    assert.equal(latestExpenseReceipt.mock.calls[0]?.[1], GASTO);
  });

  it('sandboxes the bytes a device pushed, whatever they turn out to be (audit F-01)', async () => {
    const res = await get(GASTO);
    assert.equal(
      res.headers.get('Content-Security-Policy'),
      "default-src 'none'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'none'",
    );
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  });

  it('answers 304 with no body when the browser already holds these bytes', async () => {
    const res = await get(GASTO, { 'If-None-Match': `"${HASH}"` });
    assert.equal(res.status, 304);
    assert.equal(res.headers.get('ETag'), `"${HASH}"`);
    assert.equal(await res.text(), '');
  });

  it('refuses a request without a session and reads nothing', async () => {
    readSession.mockResolvedValue(null);
    const res = await get(GASTO);
    assert.equal(res.status, 401);
    assert.equal(withTenant.mock.calls.length, 0);
  });

  it('answers 404 for an id that is not a ULID, without a query', async () => {
    const res = await get('../../etc/passwd');
    assert.equal(res.status, 404);
    assert.equal(withTenant.mock.calls.length, 0);
  });

  it('answers 404 when the gasto has no receipt', async () => {
    latestExpenseReceipt.mockResolvedValue(null);
    const res = await get(GASTO);
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('Cache-Control'), 'private, no-cache');
  });

  it('a newer receipt changes the ETag, so the old one no longer matches', async () => {
    latestExpenseReceipt.mockResolvedValue({
      id: 'R2',
      mime: 'image/webp',
      bytes: 'AAAA',
      hash: 'b'.repeat(64),
    });
    const res = await get(GASTO, { 'If-None-Match': `"${HASH}"` });
    assert.equal(res.status, 200);
    assert.notEqual(res.headers.get('ETag'), `"${HASH}"`);
  });
});
