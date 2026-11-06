import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  NewProductImageSchema,
  ProductImageSchema,
  base64ByteLength,
  isProductImageTombstone,
  latestProductImages,
  type ProductImage,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const PROD_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEZ';
const IMG_A = '01HZ8XQN9GZJXV8AKQ5X0C7MGA';
const IMG_B = '01HZ8XQN9GZJXV8AKQ5X0C7MGB';
const IMG_C = '01HZ8XQN9GZJXV8AKQ5X0C7MGC';

/** A base64 string that decodes to exactly `bytes` bytes. */
function base64Of(bytes: number): string {
  return Buffer.alloc(bytes, 7).toString('base64');
}

const photo = {
  id: IMG_A,
  productoId: PROD_ID,
  mime: 'image/webp' as const,
  bytes: base64Of(3_000),
  width: 512,
  height: 512,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-11-03T15:00:00.000Z',
  updatedAt: '2026-11-03T15:00:00.000Z',
  deletedAt: null,
};

const tombstone = { ...photo, id: IMG_B, bytes: null, width: null, height: null };

describe('ProductImageSchema (ADR-134)', () => {
  it('accepts a 512 px WebP photo and a tombstone', () => {
    assert.equal(ProductImageSchema.parse(photo).width, 512);
    assert.equal(ProductImageSchema.parse(tombstone).bytes, null);
    assert.equal(isProductImageTombstone(ProductImageSchema.parse(tombstone)), true);
    assert.equal(isProductImageTombstone(ProductImageSchema.parse(photo)), false);
  });

  it('refuses any format but WebP', () => {
    assert.throws(() => ProductImageSchema.parse({ ...photo, mime: 'image/png' }));
  });

  it('refuses bytes over the 40 KB limit, counted without decoding', () => {
    assert.equal(base64ByteLength(base64Of(MAX_PRODUCT_IMAGE_BYTES)), MAX_PRODUCT_IMAGE_BYTES);
    assert.equal(base64ByteLength('QUJD'), 3);
    assert.equal(base64ByteLength('QUI='), 2);
    assert.doesNotThrow(() =>
      ProductImageSchema.parse({ ...photo, bytes: base64Of(MAX_PRODUCT_IMAGE_BYTES) }),
    );
    assert.throws(() =>
      ProductImageSchema.parse({ ...photo, bytes: base64Of(MAX_PRODUCT_IMAGE_BYTES + 1) }),
    );
  });

  it('refuses a side over 512 px, a torn base64 and a sized tombstone', () => {
    assert.throws(() => ProductImageSchema.parse({ ...photo, width: 513 }));
    assert.throws(() => ProductImageSchema.parse({ ...photo, bytes: 'not base64!' }));
    assert.throws(() => ProductImageSchema.parse({ ...photo, bytes: 'QUJ' }), /quads/);
    assert.throws(() => ProductImageSchema.parse({ ...photo, width: null }), /tombstone/);
    assert.throws(() => ProductImageSchema.parse({ ...tombstone, width: 512 }), /tombstone/);
  });

  it('NewProductImageSchema takes a photo or a tombstone for one product', () => {
    const made = NewProductImageSchema.parse({
      productoId: PROD_ID,
      bytes: photo.bytes,
      width: 400,
      height: 400,
      businessId: BIZ_ID,
    });
    assert.equal(made.width, 400);
    assert.throws(() =>
      NewProductImageSchema.parse({
        productoId: PROD_ID,
        bytes: null,
        width: 400,
        height: null,
        businessId: BIZ_ID,
      }),
    );
  });
});

describe('latestProductImages', () => {
  const at = (id: string, createdAt: string, bytes: string | null = photo.bytes): ProductImage =>
    ProductImageSchema.parse({
      ...photo,
      id,
      bytes,
      width: bytes === null ? null : 512,
      height: bytes === null ? null : 512,
      createdAt,
      updatedAt: createdAt,
    });

  it('the later createdAt wins', () => {
    const rows = [at(IMG_A, '2026-11-03T15:00:00.000Z'), at(IMG_B, '2026-11-03T15:00:01.000Z')];
    assert.equal(latestProductImages(rows).get(photo.productoId as never)?.id, IMG_B);
    assert.equal(
      latestProductImages([...rows].reverse()).get(photo.productoId as never)?.id,
      IMG_B,
    );
  });

  it('two rows in the same second: the greater ULID wins', () => {
    const rows = [at(IMG_C, '2026-11-03T15:00:00.000Z'), at(IMG_A, '2026-11-03T15:00:00.000Z')];
    assert.equal(latestProductImages(rows).get(photo.productoId as never)?.id, IMG_C);
  });

  it('a newer tombstone wins over an older photo, and a soft-deleted row never wins', () => {
    const rows = [
      at(IMG_A, '2026-11-03T15:00:00.000Z'),
      at(IMG_B, '2026-11-03T16:00:00.000Z', null),
      { ...at(IMG_C, '2026-11-03T17:00:00.000Z'), deletedAt: '2026-11-03T17:00:01.000Z' as never },
    ];
    const newest = latestProductImages(rows).get(photo.productoId as never);
    assert.equal(newest?.id, IMG_B);
    assert.equal(newest === undefined ? false : isProductImageTombstone(newest), true);
  });

  it('is empty for no rows', () => {
    assert.equal(latestProductImages([]).size, 0);
  });
});
