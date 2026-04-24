/**
 * `useClientsForBusiness` — TanStack query listing every non-deleted
 * client of the current business. Uses `findByName('', businessId)`
 * which — via the repository contract — matches everything (the
 * `%%` LIKE pattern).
 *
 * Scoped by `currentBusinessId`; disabled until the wizard completes.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Client } from '@cachink/domain';
import { useClientsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useClientsForBusiness(): UseQueryResult<readonly Client[], Error> {
  const clients = useClientsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly Client[], Error>({
    queryKey: ['clients', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return clients.findByName('', businessId);
    },
  });
}
