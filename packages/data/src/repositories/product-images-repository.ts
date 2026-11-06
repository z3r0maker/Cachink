/**
 * ProductImagesRepository — the product photo on the device (M-13, ADR-134).
 *
 * Append-only over `product_images` (migration 0014): a photo is a row,
 * replacing it is a newer row, removing it is a tombstone (`bytes` null).
 * `create` never updates; every insert reaches the change log and the
 * outbox pushes it. Rows pulled from the cloud arrive through the reference
 * applier, which also purges the superseded ones.
 */

import type { BusinessId, NewProductImage, ProductId, ProductImage } from '@xangarro/domain';

export type { NewProductImage, ProductImage };

export interface ProductImagesRepository {
  /** Appends a photo or a tombstone, always newer than the product's last row. */
  create(input: NewProductImage): Promise<ProductImage>;
  /** The row that wins for a product — tombstone included — or null when it never had one. */
  latestForProduct(productoId: ProductId): Promise<ProductImage | null>;
  /** The winning row per product of the business, tombstones included. */
  latestForBusiness(businessId: BusinessId): Promise<ReadonlyMap<ProductId, ProductImage>>;
}
