/**
 * useConversionRecetas — lists all conversion recipes for the current business.
 * Phase 18.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ConversionReceta } from '@cachink/domain';
import { useConversionRecetasRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useConversionRecetas(): UseQueryResult<readonly ConversionReceta[], Error> {
  const repo = useConversionRecetasRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly ConversionReceta[], Error>({
    queryKey: ['conversion-recetas', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return repo.findAllByBusiness(businessId);
    },
  });
}
