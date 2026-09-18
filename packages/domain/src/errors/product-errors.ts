/** Typed errors for creating products (P-07, ADR-081). */

export class ProductInvalidError extends Error {
  readonly code = 'PRODUCT_INVALID' as const;

  constructor(readonly fields: readonly string[]) {
    super(`Revisa estos datos del producto: ${fields.join(', ')}.`);
    this.name = 'ProductInvalidError';
  }
}

/** The portal creates products at zero stock; stock is added with a movement (ADR-081). */
export class InitialStockNotAllowedError extends Error {
  readonly code = 'INITIAL_STOCK_NOT_ALLOWED' as const;

  constructor() {
    super('Aquí el producto empieza en cero. Suma existencias con un movimiento.');
    this.name = 'InitialStockNotAllowedError';
  }
}

export class ProductNotFoundError extends Error {
  readonly code = 'PRODUCT_NOT_FOUND' as const;

  constructor(readonly id: string) {
    super('Ese producto ya no existe.');
    this.name = 'ProductNotFoundError';
  }
}

/** Archiving hides units that are still on the shelf; the owner confirms it. */
export class StockNotEmptyError extends Error {
  readonly code = 'STOCK_NOT_EMPTY' as const;

  constructor(readonly stock: number) {
    super(`Aún hay ${stock} unidades en existencia.`);
    this.name = 'StockNotEmptyError';
  }
}
