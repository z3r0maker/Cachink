/**
 * EditarProductoUseCase (Audit Round 2 J3) — applies a partial patch
 * to an existing Producto.
 *
 * Responsibilities:
 *   1. Re-validate the patch fields with Zod at the boundary
 *      (defence-in-depth — UI may have skipped).
 *   2. Delegate persistence to ProductsRepository.update().
 *
 * `costoUnitCentavos` is **not** patchable: changing the unit cost
 * retroactively corrupts the inventory-valuation column on the Balance
 * General. Re-pricing flows belong in Phase 2. The patch shape
 * enforces this at compile time; the use case adds defence-in-depth
 * for misuse from JS callers.
 */

import { ProductSchema, type Product, type ProductId } from '@cachink/domain';
import type { ProductPatch, ProductsRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface EditarProductoInput {
  readonly id: ProductId;
  readonly patch: ProductPatch;
}

export class EditarProductoUseCase implements UseCase<EditarProductoInput, Product> {
  readonly #products: ProductsRepository;

  constructor(products: ProductsRepository) {
    this.#products = products;
  }

  async execute(input: EditarProductoInput): Promise<Product> {
    const existing = await this.#products.findById(input.id);
    if (!existing) {
      throw new TypeError(`Producto ${input.id} no existe o fue eliminado`);
    }
    const merged = { ...existing, ...input.patch };
    ProductSchema.parse(merged);
    const updated = await this.#products.update(input.id, input.patch);
    if (!updated) {
      throw new TypeError(`Producto ${input.id} desapareció durante la actualización`);
    }
    return updated;
  }
}
