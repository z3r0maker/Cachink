// @vitest-environment node
/**
 * The gasto receipt's encoder (M-18, ADR-149) against real Skia: a photo
 * goes in, a grayscale WebP no longer than 1024 px a side and under 96 KB
 * comes out, quality stepping 70 → 60 → 50; past that it is refused.
 */
import { beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { SkData, SkImage } from '@shopify/react-native-skia';
import {
  EXPENSE_RECEIPT_SIDE,
  ExpenseReceiptTooLargeError,
  ExpenseReceiptUnreadableError,
  MAX_EXPENSE_RECEIPT_BYTES,
} from '@xangarro/domain';
import type { SkiaApi } from '../../src/foto-producto/encode';
import { encodeReceiptPhoto, RECEIPT_QUALITIES } from '../../src/comprobante-gasto/encode';
import { loadSkia } from '../foto-producto/skia-node';

let skia: SkiaApi;

beforeAll(async () => {
  skia = await loadSkia();
});

/** A PNG `w` × `h`: a coloured ticket on a dark table, or noise that compresses badly. */
function photo(w: number, h: number, noise = false): SkData {
  const surface = skia.Surface.Make(w, h);
  assert.ok(surface);
  const canvas = surface.getCanvas();
  canvas.clear(skia.Color('#3A2A1A'));
  const paint = skia.Paint();
  paint.setColor(skia.Color('#F4E9C8'));
  canvas.drawRect({ x: w * 0.2, y: h * 0.1, width: w * 0.6, height: h * 0.8 }, paint);
  if (noise) {
    for (let i = 0; i < 40_000; i += 1) {
      const c = Math.floor(Math.random() * 0xffffff);
      paint.setColor(skia.Color(`#${c.toString(16).padStart(6, '0')}`));
      canvas.drawRect({ x: Math.random() * w, y: Math.random() * h, width: 3, height: 3 }, paint);
    }
  }
  surface.flush();
  return skia.Data.fromBytes(surface.makeImageSnapshot().encodeToBytes());
}

function decode(base64: string): SkImage {
  const img = skia.Image.MakeImageFromEncoded(skia.Data.fromBase64(base64));
  assert.ok(img, 'the WebP decodes');
  return img;
}

function rgbAt(img: SkImage, x: number, y: number): readonly number[] {
  const px = img.readPixels(x, y, { width: 1, height: 1, alphaType: 3, colorType: 4 });
  assert.ok(px);
  return [px[0] as number, px[1] as number, px[2] as number];
}

describe('encodeReceiptPhoto', () => {
  it('a tall photo comes back 1024 px high, aspect kept, grayscale WebP at q70', () => {
    const out = encodeReceiptPhoto(skia, photo(1500, 2000));
    assert.equal(out.quality, RECEIPT_QUALITIES[0]);
    assert.equal(out.height, EXPENSE_RECEIPT_SIDE);
    assert.equal(out.width, 768);
    assert.ok(out.bytes <= MAX_EXPENSE_RECEIPT_BYTES);
    assert.equal(Buffer.from(out.base64, 'base64').subarray(8, 12).toString('latin1'), 'WEBP');
    const img = decode(out.base64);
    const [r, g, b] = rgbAt(img, 384, 512);
    assert.ok(Math.abs(r! - g!) <= 2 && Math.abs(g! - b!) <= 2, `gray, not ${r},${g},${b}`);
  });

  it('never enlarges a photo already under 1024 px', () => {
    const out = encodeReceiptPhoto(skia, photo(600, 800));
    assert.equal(out.width, 600);
    assert.equal(out.height, 800);
  });

  it('a wide photo is capped on its width', () => {
    const out = encodeReceiptPhoto(skia, photo(2048, 1024));
    assert.equal(out.width, 1024);
    assert.equal(out.height, 512);
  });

  it('refuses a photo that stays over 96 KB at q50', () => {
    assert.throws(
      () => encodeReceiptPhoto(skia, photo(1024, 1024, true)),
      (e: unknown) =>
        e instanceof ExpenseReceiptTooLargeError && e.bytes > MAX_EXPENSE_RECEIPT_BYTES,
    );
  });

  it('refuses bytes that are not an image', () => {
    const basura = skia.Data.fromBytes(new Uint8Array([1, 2, 3, 4, 5]));
    assert.throws(() => encodeReceiptPhoto(skia, basura), ExpenseReceiptUnreadableError);
  });
});
