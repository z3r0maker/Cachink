/** Typed errors for the product photo (M-13, ADR-134). */

import { MAX_PRODUCT_IMAGE_BYTES } from '../entities/product-image.js';

/** The encoded photo still weighs more than a row may carry. */
export class ProductImageTooLargeError extends Error {
  readonly code = 'PRODUCT_IMAGE_TOO_LARGE' as const;

  constructor(readonly bytes: number) {
    super(
      `La foto pesa ${bytes} bytes y el límite es ${MAX_PRODUCT_IMAGE_BYTES}. Toma otra con un fondo más liso.`,
    );
    this.name = 'ProductImageTooLargeError';
  }
}

/** «Quitar foto» on a product that shows no photo: there is nothing to remove. */
export class ProductImageMissingError extends Error {
  readonly code = 'PRODUCT_IMAGE_MISSING' as const;

  constructor(readonly productoId: string) {
    super('Este producto no tiene foto.');
    this.name = 'ProductImageMissingError';
  }
}

/** The camera's or the gallery's file could not be decoded as an image. */
export class ProductImageUnreadableError extends Error {
  readonly code = 'PRODUCT_IMAGE_UNREADABLE' as const;

  constructor() {
    super('No pude abrir la foto. Toma otra.');
    this.name = 'ProductImageUnreadableError';
  }
}
