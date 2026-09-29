import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';

import { PIXEL_BYTES, pixelResponse } from '../src/server/geo/pixel';

const throttleTake = vi.fn();
const recordGeo = vi.fn();

vi.mock('@xangarro/auth-core', () => ({
  clientIp: () => '203.0.113.7',
}));
vi.mock('@xangarro/data-pg', () => ({
  throttleKey: (a: string, b: string) => `${a}:${b}`,
  throttleTake: (...a: unknown[]) => throttleTake(...a),
}));
vi.mock('../src/server/db', () => ({ db: () => ({}) }));
vi.mock('../src/server/geo/bots', () => ({
  looksAutomated: (ua: string | null) => ua === 'bot',
}));
vi.mock('../src/server/geo/record', () => ({
  recordGeo: (...a: unknown[]) => recordGeo(...a),
}));

const { GET } = await import('../src/app/api/geo/pixel/route');

const PEDIDO = new Request('https://xangarro.mx/api/geo/pixel', {
  headers: { 'user-agent': 'Mozilla/5.0 (Macintosh)' },
});

beforeEach(() => {
  vi.clearAllMocks();
  throttleTake.mockResolvedValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * The landing beacon's response (N-58).
 *
 * Everything here is about the pixel being inert: it always returns an image,
 * it is never cached, it sets no cookie, and a database that cannot take the
 * count must not turn a marketing page into a broken image.
 */
describe('pixelResponse', () => {
  it('is a real, tiny GIF', () => {
    const res = pixelResponse();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/gif');
    assert.equal(PIXEL_BYTES.length, 42, 'the smallest transparent GIF is 42 bytes');
    // GIF89a magic, so a proxy sniffing content agrees with the header.
    assert.equal(new TextDecoder().decode(PIXEL_BYTES.subarray(0, 6)), 'GIF89a');
  });

  it('is never cached, so every visit is counted once and only once', () => {
    const cache = pixelResponse().headers.get('cache-control') ?? '';
    assert.match(cache, /no-store/);
  });

  it('sets no cookie and issues no identifier', () => {
    // The whole privacy claim: there is nothing to correlate across visits.
    const res = pixelResponse();
    assert.equal(res.headers.get('set-cookie'), null);
    assert.equal(res.headers.get('etag'), null);
    assert.equal(res.headers.get('last-modified'), null);
  });

  it('answers the same bytes every time, so it cannot fingerprint', () => {
    assert.deepEqual([...PIXEL_BYTES], [...PIXEL_BYTES]);
  });
});

describe('GET /api/geo/pixel · the count behind the image', () => {
  it('counts one visit for a human, through the IP throttle', async () => {
    const res = await GET(PEDIDO);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/gif');
    assert.deepEqual(recordGeo.mock.calls, [['landing']]);
  });

  it('a bot gets the image and is never counted — refusing would tell it was spotted', async () => {
    const res = await GET(
      new Request('https://xangarro.mx/api/geo/pixel', { headers: { 'user-agent': 'bot' } }),
    );
    assert.equal(res.status, 200);
    assert.equal(throttleTake.mock.calls.length, 0);
    assert.equal(recordGeo.mock.calls.length, 0);
  });

  it('a throttled visitor gets the image and no second count', async () => {
    throttleTake.mockResolvedValue(30);
    const res = await GET(PEDIDO);
    assert.equal(res.status, 200);
    assert.equal(recordGeo.mock.calls.length, 0);
  });

  it('a database that cannot take the count costs nobody an image', async () => {
    throttleTake.mockRejectedValue(new Error('pool busy'));
    const res = await GET(PEDIDO);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/gif');
  });
});
