/**
 * In-memory ProductImagesRepository (M-13, ADR-134): append-only rows, the
 * winner per product by `latestProductImages` — the same rule the Drizzle
 * implementation and the portal read by.
 */
import type {
  BusinessId,
  DeviceId,
  NewProductImage,
  ProductId,
  ProductImage,
  ProductImageId,
} from '@xangarro/domain';
import { latestProductImages, newEntityId, now, productImageStamp } from '@xangarro/domain';
import type { ProductImagesRepository } from '@xangarro/data';

export class InMemoryProductImagesRepository implements ProductImagesRepository {
  private readonly rows: ProductImage[] = [];
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewProductImage): Promise<ProductImage> {
    const previous = await this.latestForProduct(input.productoId);
    const ts = productImageStamp(now(), previous?.createdAt ?? null);
    const row: ProductImage = {
      id: newEntityId<ProductImageId>(),
      productoId: input.productoId,
      mime: 'image/webp',
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.push(row);
    return row;
  }

  async latestForProduct(productoId: ProductId): Promise<ProductImage | null> {
    const mine = this.rows.filter((r) => r.productoId === productoId);
    return latestProductImages(mine).get(productoId) ?? null;
  }

  async latestForBusiness(businessId: BusinessId): Promise<ReadonlyMap<ProductId, ProductImage>> {
    return latestProductImages(this.rows.filter((r) => r.businessId === businessId));
  }
}
