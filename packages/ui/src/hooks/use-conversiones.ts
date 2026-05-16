/**
 * useConversiones — lists executed conversions for the current business.
 * Phase 18.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Conversion } from '@cachink/domain';
import { useConversionsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useConversiones(): UseQueryResult<readonly Conversion[], Error> {
  const repo = useConversionsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly Conversion[], Error>({
    queryKey: ['conversiones', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return repo.findByBusiness(businessId);
    },
  });
}
