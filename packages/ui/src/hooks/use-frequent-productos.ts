/**
 * `useFrequentProductos` — fetches the most-sold products for the
 * quick-sell grid on the Ventas screen (UXD-R3 C1).
 *
 * Defaults: last 14 days, limit 6. Falls back to newest productos
 * when no sales exist in the lookback window (cold start).
 */

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { FindFrequentProductosUseCase } from '@cachink/application';
import type { BusinessId, Product } from '@cachink/domain';
import { useProductsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { frequentProductosKeys } from './query-keys';

export interface UseFrequentProductosOptions {
  readonly limit?: number;
  readonly days?: number;
}

export function useFrequentProductos(
  opts: UseFrequentProductosOptions = {},
): UseQueryResult<readonly Product[]> {
  const sales = useSalesRepository();
  const products = useProductsRepository();
  const businessId = useCurrentBusinessId();
  const limit = opts.limit ?? 6;
  const days = opts.days ?? 14;

  const useCase = useMemo(
    () => new FindFrequentProductosUseCase(sales, products),
    [sales, products],
  );

  return useQuery({
    queryKey: frequentProductosKeys.byBusiness(businessId, days),
    async queryFn() {
      if (!businessId) return [];
      return useCase.execute({ businessId: businessId as BusinessId, limit, days });
    },
    enabled: businessId !== null,
  });
}
