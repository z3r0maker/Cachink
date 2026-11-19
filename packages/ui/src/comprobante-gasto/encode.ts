/**
 * The gasto receipt's encoder (M-18, ADR-149): the camera's or the
 * gallery's photo becomes the grayscale WebP an `expense_receipts` row
 * carries.
 *
 * The photo keeps its aspect and shrinks until its longest side is at most
 * {@link EXPENSE_RECEIPT_SIDE} px; it is never enlarged. Gray, because a
 * ticket is read for its figures and colour only adds weight. WebP is tried
 * at quality 70, then 60, then 50, keeping the first that fits
 * {@link MAX_EXPENSE_RECEIPT_BYTES}; past that the photo is refused rather
 * than saved unreadable. Skia is a parameter, as in the product photo's
 * encoder, so the phone and the unit tests run the same code.
 */
import type { ImageFormat, SkData, SkImage } from '@shopify/react-native-skia';
import {
  base64ByteLength,
  EXPENSE_RECEIPT_SIDE,
  ExpenseReceiptTooLargeError,
  ExpenseReceiptUnreadableError,
  MAX_EXPENSE_RECEIPT_BYTES,
} from '@xangarro/domain';
import type { SkiaApi } from '../foto-producto/encode';

/** The qualities tried, best first. */
export const RECEIPT_QUALITIES = [70, 60, 50] as const;

/** `ImageFormat.WEBP`; the enum is a runtime value this file does not import. */
const WEBP = 6 as ImageFormat;

/** Rec. 709 luma: each output channel is the same weighted sum, alpha kept. */
const GRAY = [
  0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0,
  1, 0,
];

export interface EncodedReceipt {
  /** Base64 of the WebP, as the row stores it. */
  readonly base64: string;
  /** Decoded size of the WebP in bytes. */
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
  readonly quality: (typeof RECEIPT_QUALITIES)[number];
}

/** The size the photo is drawn at: longest side capped, aspect kept, never enlarged. */
export function receiptSize(w: number, h: number): { width: number; height: number } {
  const scale = Math.min(1, EXPENSE_RECEIPT_SIDE / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/** The photo drawn gray at its receipt size. */
function compose(skia: SkiaApi, image: SkImage): SkImage {
  const { width, height } = receiptSize(image.width(), image.height());
  const surface = skia.Surface.Make(width, height);
  if (surface === null) throw new ExpenseReceiptUnreadableError();
  const paint = skia.Paint();
  paint.setColorFilter(skia.ColorFilter.MakeMatrix(GRAY));
  const src = { x: 0, y: 0, width: image.width(), height: image.height() };
  surface
    .getCanvas()
    .drawImageRectCubic(image, src, { x: 0, y: 0, width, height }, 1 / 3, 1 / 3, paint);
  surface.flush();
  return surface.makeImageSnapshot();
}

/** The receipt as the row carries it, or a typed error saying why not. */
export function encodeReceiptPhoto(skia: SkiaApi, source: SkData): EncodedReceipt {
  const image = skia.Image.MakeImageFromEncoded(source);
  if (image === null || image.width() === 0 || image.height() === 0) {
    throw new ExpenseReceiptUnreadableError();
  }
  const gray = compose(skia, image);
  let smallest = Number.POSITIVE_INFINITY;
  for (const quality of RECEIPT_QUALITIES) {
    const base64 = gray.encodeToBase64(WEBP, quality);
    const bytes = base64ByteLength(base64);
    if (bytes <= MAX_EXPENSE_RECEIPT_BYTES) {
      return { base64, bytes, width: gray.width(), height: gray.height(), quality };
    }
    smallest = Math.min(smallest, bytes);
  }
  throw new ExpenseReceiptTooLargeError(smallest);
}
