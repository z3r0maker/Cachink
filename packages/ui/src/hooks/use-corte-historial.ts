/**
 * `useCorteHistorial` — TanStack query returning the last N cortes
 * for the current business. Powers the CorteHistorialStrip on the
 * Director Home (P1C-M7 Slice 3 C6, Phase 17 Gap H).
 *
 * Fetches cortes from the last 30 days by default. Newer first.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { DayClose, IsoDate } from '@cachink/domain';
import { useDayClosesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { corteKeys } from './query-keys';

function thirtyDaysAgo(): IsoDate {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10) as IsoDate;
}

function todayStr(): IsoDate {
  return new Date().toISOString().slice(0, 10) as IsoDate;
}

export function useCorteHistorial(): UseQueryResult<readonly DayClose[], Error> {
  const repo = useDayClosesRepository();
  const businessId = useCurrentBusinessId();
  return useQuery({
    queryKey: corteKeys.historial(businessId),
    async queryFn() {
      if (!businessId) return [];
      return repo.findByDateRange(thirtyDaysAgo(), todayStr(), businessId);
    },
    enabled: businessId !== null,
  });
}
