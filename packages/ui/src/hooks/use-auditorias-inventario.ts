/**
 * `useAuditoriasInventario` — TanStack query wrapping
 * `AuditoriasInventarioRepository.findByDateRange`.
 *
 * Powers the Auditoría history tab (Part C4).
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AuditoriaInventario, IsoDate } from '@cachink/domain';
import { useAuditoriasInventarioRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { auditoriaKeys } from './query-keys';

export function useAuditoriasInventario(
  from: IsoDate,
  to: IsoDate,
): UseQueryResult<readonly AuditoriaInventario[], Error> {
  const repo = useAuditoriasInventarioRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly AuditoriaInventario[], Error>({
    queryKey: auditoriaKeys.byRange(businessId, from, to),
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return repo.findByDateRange(from, to, businessId);
    },
  });
}
