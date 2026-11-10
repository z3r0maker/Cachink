import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

import { UPLOADED_BYTES_CSP } from '@xangarro/config/security';

/**
 * `GET /api/logos/<businessId>` (N-19, audit F-01): the bytes an owner
 * uploaded, public on the portal's origin. The upload gate is one layer; this
 * is the other, and it does not trust the first: whatever is stored, opened
 * as a document it runs no script and has no origin.
 */
const logoPublico = vi.fn();

vi.mock('@xangarro/data-pg', () => ({
  logoPublico: (db: unknown, id: string) => logoPublico(db, id),
}));
vi.mock('../src/server/db', () => ({ db: () => ({}) }));

const { GET } = await import('../src/app/api/logos/[businessId]/route');

const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0BNS01';
const HOSTILE =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/2000/svg"><x:script>alert(1)</x:script></svg>';

const get = (businessId: string) =>
  GET(new Request(`http://x/api/logos/${businessId}`), {
    params: Promise.resolve({ businessId }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  logoPublico.mockResolvedValue({ mime: 'image/svg+xml', bytes: Buffer.from(HOSTILE, 'utf8') });
});

describe('the logo route', () => {
  it('sandboxes the response, even when what is stored is hostile', async () => {
    const res = await get(BUSINESS);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/svg+xml');
    assert.equal(res.headers.get('Content-Security-Policy'), UPLOADED_BYTES_CSP);
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(await res.text(), HOSTILE);
  });

  it('keeps the public cache and an ETag of the bytes', async () => {
    const res = await get(BUSINESS);
    assert.equal(res.headers.get('Cache-Control'), 'public, max-age=3600, must-revalidate');
    assert.match(res.headers.get('ETag') ?? '', /^"[A-Za-z0-9_-]{22}"$/);
    assert.equal(res.headers.get('Content-Length'), String(Buffer.byteLength(HOSTILE)));
  });

  it('answers 404 for an id that is not a ULID, without a query', async () => {
    const res = await get('../../etc/passwd');
    assert.equal(res.status, 404);
    assert.equal(logoPublico.mock.calls.length, 0);
  });

  it('answers 404 when the business has no logo', async () => {
    logoPublico.mockResolvedValue(null);
    assert.equal((await get(BUSINESS)).status, 404);
  });
});
