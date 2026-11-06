/**
 * Remove a product's photo (M-13, ADR-134): a tombstone row — `bytes` null —
 * that wins over the photo, so the tile goes back to its icon here, on the
 * other cajas and in the portal. Removing what is not there is refused: a
 * tombstone on a product with no photo would sync for nothing.
 */

import {
  isProductImageTombstone,
  ProductImageMissingError,
  ProductNotFoundError,
  type ProductId,
  type ProductImage,
} from '@xangarro/domain';
import type { ProductImagesRepository, ProductsRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';

export interface QuitarFotoProductoInput {
  readonly productoId: ProductId;
}

export class QuitarFotoProductoUseCase implements UseCase<QuitarFotoProductoInput, ProductImage> {
  constructor(
    private readonly products: Pick<ProductsRepository, 'findById'>,
    private readonly images: Pick<ProductImagesRepository, 'create' | 'latestForProduct'>,
  ) {}

  async execute(input: QuitarFotoProductoInput): Promise<ProductImage> {
    const product = await this.products.findById(input.productoId);
    if (product === null) throw new ProductNotFoundError(input.productoId);
    const current = await this.images.latestForProduct(input.productoId);
    if (current === null || isProductImageTombstone(current)) {
      throw new ProductImageMissingError(input.productoId);
    }
    return this.images.create({
      productoId: input.productoId,
      bytes: null,
      width: null,
      height: null,
      businessId: product.businessId,
    });
  }
}
