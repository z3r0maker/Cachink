/**
 * The business logo's gate (N-19), shared by the portal's upload and the
 * phone's download: what a logo may be, wherever it comes from.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { esLogoAdmitido, MAX_LOGO_BYTES } from '../../src/comprobante/index.js';

const b64 = (bytes: number): string => Buffer.alloc(bytes, 7).toString('base64');

describe('esLogoAdmitido', () => {
  it('admits a PNG, a JPG and an SVG within 2 MB', () => {
    assert.equal(esLogoAdmitido('image/png', b64(10_000)), true);
    assert.equal(esLogoAdmitido('image/jpeg', b64(MAX_LOGO_BYTES)), true);
    assert.equal(esLogoAdmitido('image/svg+xml', b64(300)), true);
  });

  it('refuses a mime the upload never stores', () => {
    assert.equal(esLogoAdmitido('text/html', b64(300)), false);
    assert.equal(esLogoAdmitido('image/webp', b64(300)), false);
  });

  it('refuses bytes over 2 MB', () => {
    assert.equal(esLogoAdmitido('image/png', b64(MAX_LOGO_BYTES + 1)), false);
  });

  it('refuses an empty body', () => {
    assert.equal(esLogoAdmitido('image/png', ''), false);
  });
});
