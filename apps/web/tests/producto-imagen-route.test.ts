import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * `GET /api/productos/<id>/imagen` (ADR-134, B-19): a product's current photo
 * for the signed-in business. The newest row wins inside the tenant
 * transaction (`latestProductImage`, proved against Postgres in data-pg);
 * this covers the gate and the answer: 401 without a session, 404 for a
 * malformed id or no photo, the WebP with a private, revalidated cache and
 * an ETag of the bytes, and 304 when the browser already has them.
 */
const readSession = vi.fn();
const latestProductImage = vi.fn();
const withTenant = vi.fn();

vi.mock('../src/server/session', () => ({ readSession }));
vi.mock('../src/server/db', () => ({
  withTenant: (b: string, fn: (tx: unknown) => unknown) => withTenant(b, fn),
}));
vi.mock('@xangarro/data-pg', () => ({
  latestProductImage: (tx: unknown, id: string) => latestProductImage(tx, id),
}));

const { GET } = await import('../src/app/api/productos/[productId]/imagen/route');

const PRODUCT = '01HZ8XQN9GZJXV8AKQ5X0PRD01';
const WEBP = Buffer.from('RIFF\u0010\u0000\u0000\u0000WEBPVP8 fake', 'latin1');

const get = (productId: string, headers: Record<string, string> = {}) =>
  GET(new Request(`http://x/api/productos/${productId}/imagen`, { headers }), {
    params: Promise.resolve({ productId }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  readSession.mockResolvedValue({ business_id: 'biz-1' });
  withTenant.mockImplementation(async (_b: string, fn: (tx: unknown) => unknown) => fn({}));
  latestProductImage.mockResolvedValue({ mime: 'image/webp', bytes: WEBP.toString('base64') });
});

describe('the product photo route', () => {
  it('answers the newest photo as WebP, read inside the business’s tenant', async () => {
    const res = await get(PRODUCT);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/webp');
    assert.equal(res.headers.get('Content-Length'), String(WEBP.byteLength));
    assert.equal(res.headers.get('Cache-Control'), 'private, no-cache');
    assert.match(res.headers.get('ETag') ?? '', /^"[A-Za-z0-9_-]{22}"$/);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), WEBP);
    assert.equal(withTenant.mock.calls[0]?.[0], 'biz-1');
    assert.equal(latestProductImage.mock.calls[0]?.[1], PRODUCT);
  });

  it('sandboxes the bytes a device pushed, whatever they turn out to be (audit F-01)', async () => {
    latestProductImage.mockResolvedValue({
      mime: 'image/svg+xml',
      bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>').toString(
        'base64',
      ),
    });
    const res = await get(PRODUCT);
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get('Content-Security-Policy'),
      "default-src 'none'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'none'",
    );
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  });

  it('answers 304 with no body when the browser already holds these bytes', async () => {
    const etag = (await get(PRODUCT)).headers.get('ETag') ?? '';
    const res = await get(PRODUCT, { 'If-None-Match': etag });
    assert.equal(res.status, 304);
    assert.equal(res.headers.get('ETag'), etag);
    assert.equal(await res.text(), '');
  });

  it('refuses a request without a session and reads nothing', async () => {
    readSession.mockResolvedValue(null);
    const res = await get(PRODUCT);
    assert.equal(res.status, 401);
    assert.equal(withTenant.mock.calls.length, 0);
  });

  it('answers 404 for an id that is not a ULID, without a query', async () => {
    const res = await get('../../etc/passwd');
    assert.equal(res.status, 404);
    assert.equal(withTenant.mock.calls.length, 0);
  });

  it('answers 404 when the product has no photo or its newest row is a tombstone', async () => {
    latestProductImage.mockResolvedValue(null);
    const res = await get(PRODUCT);
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('Cache-Control'), 'private, no-cache');
  });

  it('a changed photo changes the ETag, so the old one no longer matches', async () => {
    const before = (await get(PRODUCT)).headers.get('ETag') ?? '';
    latestProductImage.mockResolvedValue({ mime: 'image/webp', bytes: 'AAAA' });
    const res = await get(PRODUCT, { 'If-None-Match': before });
    assert.equal(res.status, 200);
    assert.notEqual(res.headers.get('ETag'), before);
  });
});
