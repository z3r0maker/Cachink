/**
 * ProductImage (Foto del producto) — the photo on a product's tile (ADR-134).
 *
 * A photo is a **row, not a file**: a 512 px WebP, lifted off its background
 * on the phone, carried as base64 so it rides the sync like any other row.
 * The table is append-only (HYBRID, insert-only on the wire): replacing a
 * photo is a new row, removing it is a **tombstone** — a row whose `bytes`
 * is `null`. The newest row per product wins, by `createdAt` then `id`
 * ({@link latestProductImages}); nothing is ever updated.
 *
 * Sizes are bounded here and again by the wire's row limit: a photo decodes
 * to at most {@link MAX_PRODUCT_IMAGE_BYTES}, so its base64 stays well under
 * the 64 KB `product_images` row.
 */

import { z } from 'zod';
import type { IsoTimestamp } from '../dates/index.js';
import type { BusinessId, ProductId, ProductImageId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

/** The only format a photo travels in: WebP keeps alpha and compresses the cutout. */
export const PRODUCT_IMAGE_MIME = 'image/webp' as const;

/** A photo is square, at most this many pixels a side (4× a 120 pt tile). */
export const PRODUCT_IMAGE_SIDE = 512 as const;

/** Decoded bytes a photo may weigh; the encoder steps quality down until it fits. */
export const MAX_PRODUCT_IMAGE_BYTES = 40_960 as const;

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** How many bytes a base64 string decodes to, without decoding it. */
export function base64ByteLength(b64: string): number {
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

const imageBytesField = z
  .string()
  .regex(BASE64, 'bytes must be base64')
  .refine((v) => v.length % 4 === 0, { message: 'bytes must be whole base64 quads' })
  .refine((v) => base64ByteLength(v) <= MAX_PRODUCT_IMAGE_BYTES, {
    message: `bytes must decode to at most ${MAX_PRODUCT_IMAGE_BYTES} bytes`,
  });

const sideField = z.number().int().min(1).max(PRODUCT_IMAGE_SIDE);

/** A photo carries its size; a tombstone carries none. */
const photoOrTombstone = {
  message: 'a photo has width and height; a tombstone (bytes null) has neither',
  path: ['bytes'] as PropertyKey[],
};
const sized = (v: { bytes: string | null; width: number | null; height: number | null }) =>
  (v.bytes === null) === (v.width === null) && (v.bytes === null) === (v.height === null);

export const ProductImageSchema = z
  .object({
    id: ulidField<ProductImageId>(),
    productoId: ulidField<ProductId>(),
    mime: z.literal(PRODUCT_IMAGE_MIME),
    /** Base64 WebP; `null` is the tombstone that removes the photo. */
    bytes: imageBytesField.nullable(),
    width: sideField.nullable(),
    height: sideField.nullable(),
  })
  .merge(auditSchema)
  .refine(sized, photoOrTombstone);

export type ProductImage = z.infer<typeof ProductImageSchema>;

export const NewProductImageSchema = z
  .object({
    productoId: ulidField<ProductId>(),
    bytes: imageBytesField.nullable(),
    width: sideField.nullable(),
    height: sideField.nullable(),
    businessId: ulidField<BusinessId>(),
  })
  .refine(sized, photoOrTombstone);

export type NewProductImage = z.infer<typeof NewProductImageSchema>;

/** A row that removes the photo rather than setting one. */
export function isProductImageTombstone(image: Pick<ProductImage, 'bytes'>): boolean {
  return image.bytes === null;
}

/** `a` is newer than `b`: later `createdAt`, and the greater ULID on a tie. */
function newer(a: ProductImage, b: ProductImage): boolean {
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt;
  return a.id > b.id;
}

/**
 * The newest row per product, tombstones included — the one that wins
 * (ADR-134 §3). Read a product's photo as
 * `latestProductImages(rows).get(productId)`, then skip it when it is a
 * tombstone.
 */
export function latestProductImages(
  rows: readonly ProductImage[],
): ReadonlyMap<ProductId, ProductImage> {
  const out = new Map<ProductId, ProductImage>();
  for (const row of rows) {
    if (row.deletedAt !== null) continue;
    const current = out.get(row.productoId);
    if (current === undefined || newer(row, current)) out.set(row.productoId, row);
  }
  return out;
}

/**
 * The `createdAt` a new row takes so it is newer than `previous`, the row it
 * replaces: the clock, or one millisecond past `previous` when the clock has
 * not passed it (the same millisecond, or a row stamped ahead by another
 * phone's clock). Without this, «Quitar foto» right after a photo could lose
 * to it on the ULID tiebreak.
 */
export function productImageStamp(
  clock: IsoTimestamp,
  previous: IsoTimestamp | null,
): IsoTimestamp {
  if (previous === null || clock > previous) return clock;
  return new Date(Date.parse(previous) + 1).toISOString() as IsoTimestamp;
}
