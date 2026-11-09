/**
 * Save a product's photo (M-13, ADR-134): the encoded 512 px WebP becomes a
 * new `product_images` row on the product's own business. Replacing a photo
 * is the same call — the newer row wins; nothing is updated.
 *
 * The encoder already keeps the photo under the row limit; this checks it
 * again at the boundary, because the row is what syncs to every caja.
 */

import {
  base64ByteLength,
  MAX_PRODUCT_IMAGE_BYTES,
  NewProductImageSchema,
  ProductImageTooLargeError,
  ProductImageUnreadableError,
  ProductNotFoundError,
  type ProductId,
  type ProductImage,
} from '@xangarro/domain';
import type { ProductImagesRepository, ProductsRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';

export interface CapturarFotoProductoInput {
  readonly productoId: ProductId;
  /** Base64 of the WebP the encoder produced. */
  readonly bytes: string;
  readonly width: number;
  readonly height: number;
}

export class CapturarFotoProductoUseCase implements UseCase<
  CapturarFotoProductoInput,
  ProductImage
> {
  constructor(
    private readonly products: Pick<ProductsRepository, 'findById'>,
    private readonly images: Pick<ProductImagesRepository, 'create'>,
  ) {}

  async execute(input: CapturarFotoProductoInput): Promise<ProductImage> {
    const product = await this.products.findById(input.productoId);
    if (product === null) throw new ProductNotFoundError(input.productoId);
    const weight = base64ByteLength(input.bytes);
    if (weight > MAX_PRODUCT_IMAGE_BYTES) throw new ProductImageTooLargeError(weight);
    const parsed = NewProductImageSchema.safeParse({
      productoId: input.productoId,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      businessId: product.businessId,
    });
    if (!parsed.success) throw new ProductImageUnreadableError();
    return this.images.create(parsed.data);
  }
}
