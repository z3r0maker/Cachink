/**
 * `useProductos` — TanStack query listing every non-deleted producto
 * for the current business.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Product } from '@cachink/domain';
import { useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useProductos(): UseQueryResult<readonly Product[], Error> {
  const products = useProductsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly Product[], Error>({
    queryKey: ['productos', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return products.listForBusiness(businessId);
    },
  });
}
