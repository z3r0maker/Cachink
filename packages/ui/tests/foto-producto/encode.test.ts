// @vitest-environment node
/**
 * The product photo's encoder (M-13, ADR-134) against real Skia: fixture
 * PNGs in `tests/fixtures/foto-producto/` (see its README) go in, a 512 px
 * WebP under the row limit comes out, quality stepping 80 → 70 → 60.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { SkImage } from '@shopify/react-native-skia';
import type { SkiaApi } from '../../src/foto-producto/encode';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  ProductImageTooLargeError,
  ProductImageUnreadableError,
} from '@xangarro/domain';
import { encodeProductPhoto, PHOTO_MARGIN } from '../../src/foto-producto/encode';
import { loadSkia } from './skia-node';

const FIXTURES = join(__dirname, '..', 'fixtures', 'foto-producto');
let skia: SkiaApi;

beforeAll(async () => {
  skia = await loadSkia();
});

const fixture = (name: string) =>
  skia.Data.fromBytes(new Uint8Array(readFileSync(join(FIXTURES, name))));

/** The encoded WebP decoded back, to look at its pixels. */
function decode(base64: string): SkImage {
  const img = skia.Image.MakeImageFromEncoded(skia.Data.fromBase64(base64));
  assert.ok(img, 'the WebP decodes');
  return img;
}

function alphaAt(img: SkImage, x: number, y: number): number {
  const px = img.readPixels(x, y, { width: 1, height: 1, alphaType: 3, colorType: 4 });
  assert.ok(px);
  return px[3] as number;
}

describe('encodeProductPhoto', () => {
  it('a cutout becomes a 512 px WebP at q80, centred with an 8 % clear margin', () => {
    const out = encodeProductPhoto(skia, fixture('recorte-alto.png'), { lifted: true });
    assert.equal(out.quality, 80);
    assert.equal(out.side, 512);
    assert.ok(out.bytes <= MAX_PRODUCT_IMAGE_BYTES);
    assert.equal(Buffer.from(out.base64, 'base64').subarray(8, 12).toString('latin1'), 'WEBP');
    const img = decode(out.base64);
    assert.equal(img.width(), 512);
    assert.equal(img.height(), 512);
    // The fixture is a tight 180 × 460 cutout: its height meets the margin.
    const margin = 512 * PHOTO_MARGIN;
    const column = Array.from({ length: 512 }, (_, y) => alphaAt(img, 256, y));
    const top = column.findIndex((a) => a > 128);
    const bottom = 511 - [...column].reverse().findIndex((a) => a > 128);
    assert.ok(Math.abs(top - margin) <= 2, `subject starts at the margin (${top})`);
    assert.ok(Math.abs(511 - bottom - margin) <= 2, `and ends at it (${bottom})`);
    for (const y of [0, 256, 511]) assert.equal(alphaAt(img, 2, y), 0, 'the sides stay clear');
    assert.equal(alphaAt(img, 256, 256), 255, 'the subject sits in the middle');
  });

  it('a photo that was not lifted fills the whole square, cropped to its centre', () => {
    const out = encodeProductPhoto(skia, fixture('foto-ancha.png'), { lifted: false });
    assert.equal(out.quality, 80);
    const img = decode(out.base64);
    for (const [x, y] of [
      [1, 1],
      [510, 1],
      [1, 510],
      [510, 510],
    ] as const)
      assert.equal(alphaAt(img, x, y), 255);
  });

  it('steps quality down to 70, then 60, until the photo fits the row', () => {
    const medio = encodeProductPhoto(skia, fixture('grano-medio.png'), { lifted: false });
    assert.equal(medio.quality, 70);
    assert.ok(medio.bytes <= MAX_PRODUCT_IMAGE_BYTES);
    const fino = encodeProductPhoto(skia, fixture('grano-fino.png'), { lifted: false });
    assert.equal(fino.quality, 60);
    assert.ok(fino.bytes <= MAX_PRODUCT_IMAGE_BYTES);
  });

  it('a photo still too heavy at q60 is refused, not saved half-done', () => {
    assert.throws(
      () => encodeProductPhoto(skia, fixture('ruido.png'), { lifted: false }),
      (e: unknown) => e instanceof ProductImageTooLargeError && e.bytes > MAX_PRODUCT_IMAGE_BYTES,
    );
  });

  it('bytes that are not an image are refused as unreadable', () => {
    const junk = skia.Data.fromBytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    assert.throws(
      () => encodeProductPhoto(skia, junk, { lifted: true }),
      ProductImageUnreadableError,
    );
  });
});
