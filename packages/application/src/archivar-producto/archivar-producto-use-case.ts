/**
 * Archive a product (P-07, ADR-081 follow-up). Archiving is a soft delete: the
 * row stays, so past sales keep their meaning, and it disappears from every
 * catalogue and caja.
 *
 * The rule that used to live in the phone's UI hook: while units remain, the
 * owner must confirm (`force`), because archiving hides stock still on the
 * shelf. The portal is where archiving happens (owner decision, 2026-09-18);
 * the phone's delete goes with A-12.
 */

import { ProductNotFoundError, StockNotEmptyError, type ProductId } from '@xangarro/domain';
import type { InventoryMovementsRepository, ProductsRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';

export interface ArchivarProductoInput {
  readonly id: ProductId;
  /** Archive even with units left — the owner saw the count and confirmed. */
  readonly force?: boolean;
}

export class ArchivarProductoUseCase implements UseCase<ArchivarProductoInput, void> {
  constructor(
    private readonly products: Pick<ProductsRepository, 'findById' | 'delete'>,
    private readonly movements: Pick<InventoryMovementsRepository, 'sumStock'>,
  ) {}

  async execute(input: ArchivarProductoInput): Promise<void> {
    const product = await this.products.findById(input.id);
    if (product === null) throw new ProductNotFoundError(input.id);
    const stock = await this.movements.sumStock(input.id);
    if (stock > 0 && input.force !== true) throw new StockNotEmptyError(stock);
    await this.products.delete(input.id);
  }
}
