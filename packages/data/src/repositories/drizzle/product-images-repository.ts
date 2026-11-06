/**
 * Drizzle-backed {@link ProductImagesRepository} (M-13, ADR-134). Inserts
 * only: the change-log trigger on `product_images` queues every row for the
 * push. The winner per product is `latestProductImages`, the rule the
 * portal and the reference applier's purge follow too.
 */

import { and, desc, eq, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  NewProductImage,
  ProductId,
  ProductImage,
  ProductImageId,
  UserId,
} from '@xangarro/domain';
import {
  latestProductImages,
  newEntityId,
  now,
  PRODUCT_IMAGE_MIME,
  productImageStamp,
} from '@xangarro/domain';
import type { ProductImagesRepository } from '../product-images-repository.js';
import { productImages } from '../../schema/index.js';
import type { XangarroDatabase } from './_db.js';

type ImageRow = typeof productImages.$inferSelect;

export class DrizzleProductImagesRepository implements ProductImagesRepository {
  readonly #db: XangarroDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: XangarroDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewProductImage): Promise<ProductImage> {
    const previous = await this.latestForProduct(input.productoId);
    const ts = productImageStamp(now(), previous?.createdAt ?? null);
    const row: ImageRow = {
      id: newEntityId<ProductImageId>(),
      productoId: input.productoId,
      mime: PRODUCT_IMAGE_MIME,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: this.#userId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    await this.#db.insert(productImages).values(row).run();
    return this.#mapRow(row);
  }

  async latestForProduct(productoId: ProductId): Promise<ProductImage | null> {
    const row = await this.#db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productoId, productoId), isNull(productImages.deletedAt)))
      .orderBy(desc(productImages.createdAt), desc(productImages.id))
      .limit(1)
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async latestForBusiness(businessId: BusinessId): Promise<ReadonlyMap<ProductId, ProductImage>> {
    const rows = await this.#db
      .select()
      .from(productImages)
      .where(and(eq(productImages.businessId, businessId), isNull(productImages.deletedAt)))
      .all();
    return latestProductImages(rows.map((r) => this.#mapRow(r)));
  }

  #mapRow(row: ImageRow): ProductImage {
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
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
