/**
 * `useVentasByDate` — TanStack query over SalesRepository.findByDate
 * scoped to the current business. Callers pass the ISO date string.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Sale } from '@cachink/domain';
import { useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useVentasByDate(fecha: string): UseQueryResult<readonly Sale[], Error> {
  const sales = useSalesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly Sale[], Error>({
    queryKey: ['ventas', businessId, fecha],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return sales.findByDate(fecha, businessId);
    },
  });
}
