/**
 * `useProductosConStock` — combines useProductos + per-product
 * sumStock calls. Returns rows `{ producto, stock }` for each
 * non-deleted producto.
 *
 * Cost: O(N) stock lookups. At Phase 1C scale (<1000 products per
 * business) this is fine; a dedicated SQL aggregation can land when
 * Director Home starts showing stock KPIs for larger catalogs.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Product } from '@cachink/domain';
import { useInventoryMovementsRepository, useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface ProductoConStock {
  readonly producto: Product;
  readonly stock: number;
}

export function useProductosConStock(): UseQueryResult<readonly ProductoConStock[], Error> {
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly ProductoConStock[], Error>({
    queryKey: ['productos-con-stock', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      const rows = await products.listForBusiness(businessId);
      const withStock: ProductoConStock[] = [];
      for (const producto of rows) {
        const stock = await movements.sumStock(producto.id);
        withStock.push({ producto, stock });
      }
      return withStock;
    },
  });
}
