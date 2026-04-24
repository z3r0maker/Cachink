/**
 * ProductsRepository — catalogue CRUD + SKU / business-scope lookups.
 */

import type { BusinessId, NewProduct, Product, ProductId } from '@cachink/domain';

export type { Product, NewProduct };

export interface ProductsRepository {
  create(input: NewProduct): Promise<Product>;
  findById(id: ProductId): Promise<Product | null>;
  /** SKU is optional on products; this returns the first matching non-deleted row. */
  findBySku(sku: string, businessId: BusinessId): Promise<Product | null>;
  listForBusiness(businessId: BusinessId): Promise<readonly Product[]>;
  delete(id: ProductId): Promise<void>;
}
