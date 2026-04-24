/**
 * `useMovimientosRecientes` — TanStack query over
 * InventoryMovementsRepository.findByDateRange, capped at 40 most
 * recent movements. Spans the last 90 days by default.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InventoryMovement, IsoDate } from '@cachink/domain';
import { useInventoryMovementsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

const DEFAULT_WINDOW_DAYS = 90;
const DEFAULT_LIMIT = 40;

function daysAgo(days: number): IsoDate {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as IsoDate;
}

function today(): IsoDate {
  return new Date().toISOString().slice(0, 10) as IsoDate;
}

export function useMovimientosRecientes(
  limit: number = DEFAULT_LIMIT,
): UseQueryResult<readonly InventoryMovement[], Error> {
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly InventoryMovement[], Error>({
    queryKey: ['movimientos', businessId, limit],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      const rows = await movements.findByDateRange(
        daysAgo(DEFAULT_WINDOW_DAYS),
        today(),
        businessId,
      );
      const sorted = [...rows].sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
      return sorted.slice(0, limit);
    },
  });
}
