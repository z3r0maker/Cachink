/**
 * `useCajaHistorial` — TanStack query wrapping
 * `CajaTurnosRepository.findByDateRange`. Returns closed + open turns
 * for a date range.
 *
 * Powers the Caja Reportes screen (Part C2).
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CajaTurno, IsoDate } from '@cachink/domain';
import { useCajaTurnosRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { cajaHistorialKeys } from './query-keys';

export function useCajaHistorial(
  from: IsoDate,
  to: IsoDate,
): UseQueryResult<readonly CajaTurno[], Error> {
  const turnos = useCajaTurnosRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly CajaTurno[], Error>({
    queryKey: cajaHistorialKeys.byRange(businessId, from, to),
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return turnos.findByDateRange(from, to, businessId);
    },
  });
}
