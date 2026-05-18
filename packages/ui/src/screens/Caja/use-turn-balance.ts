/**
 * useTurnBalance — computes the live CajaBalanceResult for an open turn.
 *
 * Extracted from caja-active-turn.tsx to stay under 40-line limit.
 */

import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaBalanceResult, CajaTurno } from '@cachink/domain';
import { computeCajaBalance } from '@cachink/domain';
import {
  useSalesRepository,
  useExpensesRepository,
  useCajaMovimientosRepository,
} from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { buildBalanceInput } from './build-balance-input';

export function useTurnBalance(turno: CajaTurno): CajaBalanceResult {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const salesRepo = useSalesRepository();
  const expensesRepo = useExpensesRepository();
  const movRepo = useCajaMovimientosRepository();

  const salesQ = useQuery({
    queryKey: ['caja-balance-sales', turno.id],
    queryFn: () =>
      businessId
        ? salesRepo.findByDateRange(turno.fecha, turno.fecha, businessId)
        : [],
    enabled: businessId !== null,
  });
  const expensesQ = useQuery({
    queryKey: ['caja-balance-expenses', turno.id],
    queryFn: () =>
      businessId
        ? expensesRepo.findByDateRange(turno.fecha, turno.fecha, businessId)
        : [],
    enabled: businessId !== null,
  });
  const movQ = useQuery({
    queryKey: ['caja-balance-movimientos', turno.id],
    queryFn: () => movRepo.findByTurno(turno.id),
  });

  return computeCajaBalance(
    buildBalanceInput(turno, salesQ.data ?? [], expensesQ.data ?? [], movQ.data ?? []),
  );
}
