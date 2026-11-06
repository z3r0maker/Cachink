/**
 * The product photo's encoder (M-13, ADR-134): whatever the lift handed
 * back becomes the 512 px WebP a `product_images` row carries.
 *
 * - A **lifted** cutout sits centred on a transparent 512 × 512 canvas with
 *   an 8 % margin, so the tile's tint shows around it.
 * - A photo that was **not lifted** fills the whole square, cropped to its
 *   centre (the native side already squared it; this guards the rest).
 *
 * WebP is tried at quality 80, then 70, then 60, keeping the first that
 * fits {@link MAX_PRODUCT_IMAGE_BYTES}; past that the photo is refused
 * rather than saved blurred. Skia is a parameter, never imported here, so
 * the same code runs on the phone (react-native-skia) and in the unit tests
 * (CanvasKit through the same `JsiSkApi` the web build uses).
 */
import type { ImageFormat, SkData, SkImage, SkRect, Skia } from '@shopify/react-native-skia';
import {
  base64ByteLength,
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_SIDE,
  ProductImageTooLargeError,
  ProductImageUnreadableError,
} from '@xangarro/domain';

/** react-native-skia's API object; its interface is only reachable as `typeof Skia`. */
export type SkiaApi = typeof Skia;

/** Clear space around a lifted subject, as a share of the side. */
export const PHOTO_MARGIN = 0.08;

/** The qualities tried, best first. */
export const PHOTO_QUALITIES = [80, 70, 60] as const;

/** `ImageFormat.WEBP`; the enum is a runtime value this file does not import. */
const WEBP = 6 as ImageFormat;

/** Mitchell cubic resampling (B = C = 1/3): soft edges without ringing. */
const CUBIC_B = 1 / 3;
const CUBIC_C = 1 / 3;

export interface EncodedPhoto {
  /** Base64 of the WebP, as the row stores it. */
  readonly base64: string;
  /** Decoded size of the WebP in bytes. */
  readonly bytes: number;
  /** Width and height; the photo is square. */
  readonly side: typeof PRODUCT_IMAGE_SIDE;
  readonly quality: (typeof PHOTO_QUALITIES)[number];
}

/** Where a lifted subject lands: centred inside the margin, aspect kept. */
function containRect(w: number, h: number): SkRect {
  const box = PRODUCT_IMAGE_SIDE * (1 - 2 * PHOTO_MARGIN);
  const scale = Math.min(box / w, box / h);
  const dw = w * scale;
  const dh = h * scale;
  return {
    x: (PRODUCT_IMAGE_SIDE - dw) / 2,
    y: (PRODUCT_IMAGE_SIDE - dh) / 2,
    width: dw,
    height: dh,
  };
}

/** The largest centred square of the source, for a photo drawn edge to edge. */
function centreSquare(w: number, h: number): SkRect {
  const side = Math.min(w, h);
  return { x: (w - side) / 2, y: (h - side) / 2, width: side, height: side };
}

/** The 512 px square with the photo drawn on it, background transparent. */
function compose(skia: SkiaApi, image: SkImage, lifted: boolean): SkImage {
  const side = PRODUCT_IMAGE_SIDE;
  const surface = skia.Surface.Make(side, side);
  if (surface === null) throw new ProductImageUnreadableError();
  const canvas = surface.getCanvas();
  canvas.clear(skia.Color('transparent'));
  const w = image.width();
  const h = image.height();
  const full: SkRect = { x: 0, y: 0, width: side, height: side };
  const src = lifted ? { x: 0, y: 0, width: w, height: h } : centreSquare(w, h);
  const dst = lifted ? containRect(w, h) : full;
  canvas.drawImageRectCubic(image, src, dst, CUBIC_B, CUBIC_C);
  surface.flush();
  return surface.makeImageSnapshot();
}

/** The photo as the row carries it, or a typed error saying why not. */
export function encodeProductPhoto(
  skia: SkiaApi,
  source: SkData,
  options: { readonly lifted: boolean },
): EncodedPhoto {
  const image = skia.Image.MakeImageFromEncoded(source);
  if (image === null || image.width() === 0 || image.height() === 0) {
    throw new ProductImageUnreadableError();
  }
  const square = compose(skia, image, options.lifted);
  let smallest = Number.POSITIVE_INFINITY;
  for (const quality of PHOTO_QUALITIES) {
    const base64 = square.encodeToBase64(WEBP, quality);
    const bytes = base64ByteLength(base64);
    if (bytes <= MAX_PRODUCT_IMAGE_BYTES) {
      return { base64, bytes, side: PRODUCT_IMAGE_SIDE, quality };
    }
    smallest = Math.min(smallest, bytes);
  }
  throw new ProductImageTooLargeError(smallest);
}
