import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { PIXEL_BYTES, pixelResponse } from '../src/server/geo/pixel';

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
