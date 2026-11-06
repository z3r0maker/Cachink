import 'server-only';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { productImages } from '@xangarro/data-pg';
import type { ProductImagesRepository } from '@xangarro/data';
import {
  latestProductImages,
  newUlid,
  PRODUCT_IMAGE_MIME,
  productImageStamp,
  type BusinessId,
  type DeviceId,
  type IsoTimestamp,
  type NewProductImage,
  type ProductId,
  type ProductImage,
  type ProductImageId,
  type UserId,
} from '@xangarro/domain';

import type { Tx } from '../db';
import { PORTAL_DEVICE_ID } from './portal-device';
import { recordChange } from './sync-log';

/**
 * A Postgres `ProductImagesRepository`, bound to one tenant transaction (P-42).
 *
 * Like `pgProductsRepository`, no rule lives here: `QuitarFotoProductoUseCase`
 * refuses an unknown product and a photo that is not there, on the phone and
 * here alike. What is the cloud's own is structural: RLS scopes every read,
 * so `businessId` is never used to filter, and every insert appends to
 * `sync_log` in the same transaction, which is how every phone learns the
 * photo changed. The table is append-only: there is nothing to update.
 */
type ImageRow = typeof productImages.$inferSelect;

function toDomain(row: ImageRow): ProductImage {
  const iso = (t: string) => new Date(t).toISOString() as IsoTimestamp;
  return {
    id: row.id as ProductImageId,
    productoId: row.productoId as ProductId,
    mime: PRODUCT_IMAGE_MIME,
    bytes: row.bytes ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    businessId: row.businessId as BusinessId,
    deviceId: row.deviceId as DeviceId,
    createdByUserId: (row.createdByUserId ?? null) as UserId | null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    deletedAt: row.deletedAt === null ? null : iso(row.deletedAt),
  };
}

async function latestFor(tx: Tx, productoId: ProductId): Promise<ProductImage | null> {
  const [row] = await tx
    .select()
    .from(productImages)
    .where(and(eq(productImages.productoId, productoId), isNull(productImages.deletedAt)))
    .orderBy(desc(productImages.createdAt), desc(productImages.id))
    .limit(1);
  return row ? toDomain(row) : null;
}

/** One insert, always newer than the product's last row, and its `sync_log` entry. */
async function append(
  tx: Tx,
  businessId: BusinessId,
  input: NewProductImage,
): Promise<ProductImage> {
  const previous = await latestFor(tx, input.productoId);
  const stamp = productImageStamp(
    new Date().toISOString() as IsoTimestamp,
    previous?.createdAt ?? null,
  );
  const [row] = await tx
    .insert(productImages)
    .values({
      id: newUlid(),
      productoId: input.productoId,
      mime: PRODUCT_IMAGE_MIME,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      businessId,
      deviceId: PORTAL_DEVICE_ID,
      // The portal's accounts are not the phone's operators (like every pg repository).
      createdByUserId: null,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
    })
    .returning();
  if (!row) throw new Error('product image insert returned no row');
  await recordChange(tx, businessId, 'product_images', row.id, 'insert');
  return toDomain(row);
}

export function pgProductImagesRepository(tx: Tx, businessId: BusinessId): ProductImagesRepository {
  return {
    latestForProduct: (productoId) => latestFor(tx, productoId),
    async latestForBusiness() {
      const rows = await tx.select().from(productImages).where(isNull(productImages.deletedAt));
      return latestProductImages(rows.map(toDomain));
    },
    create: (input) => append(tx, businessId, input),
  };
}
