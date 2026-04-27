/**
 * ProductsRepository — catalogue CRUD + SKU / business-scope lookups.
 */

import type { BusinessId, NewProduct, Product, ProductId } from '@cachink/domain';

export type { Product, NewProduct };

/**
 * Partial-patch shape for `update()` per ADR-023.
 *
 * Excludes `costoUnitCentavos` deliberately: changing the unit cost
 * would retroactively corrupt the inventory-valuation column on the
 * Balance General (NIF B-6). Re-pricing flows belong in Phase 2 with
 * a movimiento-adjustment story; for Phase 1 the cost is locked once
 * the producto is created.
 *
 * Audit Round 2 J3: enables per-row swipe-to-edit (Phase K wiring).
 */
export type ProductPatch = Partial<
  Pick<Product, 'nombre' | 'sku' | 'categoria' | 'unidad' | 'umbralStockBajo'>
>;

export interface ProductsRepository {
  create(input: NewProduct): Promise<Product>;
  findById(id: ProductId): Promise<Product | null>;
  /** SKU is optional on products; this returns the first matching non-deleted row. */
  findBySku(sku: string, businessId: BusinessId): Promise<Product | null>;
  listForBusiness(businessId: BusinessId): Promise<readonly Product[]>;
  /**
   * Partial update per ADR-023 — `costoUnitCentavos` is intentionally
   * excluded (see {@link ProductPatch}). Returns the post-update row
   * or null when not found / soft-deleted. Audit Round 2 J3.
   */
  update(id: ProductId, patch: ProductPatch): Promise<Product | null>;
  delete(id: ProductId): Promise<void>;
  /** Count non-deleted products for the wizard data-preserved callout (ADR-039). */
  count(businessId: BusinessId): Promise<number>;
}
