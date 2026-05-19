/**
 * useExpectedCash — computes expected cash for a turno during close flow.
 *
 * Extracted from cerrar-caja-modal.tsx for the 40-line limit.
 */

import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno, Money } from '@cachink/domain';
import { computeCajaBalance, ZERO } from '@cachink/domain';
import {
  useSalesRepository,
  useExpensesRepository,
  useCajaMovimientosRepository,
} from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { buildBalanceInput } from './build-balance-input';

export function useExpectedCash(turno: CajaTurno | null): Money {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const salesRepo = useSalesRepository();
  const expensesRepo = useExpensesRepository();
  const movRepo = useCajaMovimientosRepository();
  const fecha = turno?.fecha ?? '';

  const salesQ = useQuery({
    queryKey: ['cerrar-sales', turno?.id],
    queryFn: () =>
      businessId && turno ? salesRepo.findByDateRange(fecha, fecha, businessId) : [],
    enabled: !!turno && !!businessId,
  });
  const expensesQ = useQuery({
    queryKey: ['cerrar-expenses', turno?.id],
    queryFn: () =>
      businessId && turno ? expensesRepo.findByDateRange(fecha, fecha, businessId) : [],
    enabled: !!turno && !!businessId,
  });
  const movQ = useQuery({
    queryKey: ['cerrar-movimientos', turno?.id],
    queryFn: () => (turno ? movRepo.findByTurno(turno.id) : []),
    enabled: !!turno,
  });

  if (!turno) return ZERO;

  const balance = computeCajaBalance(
    buildBalanceInput(turno, salesQ.data ?? [], expensesQ.data ?? [], movQ.data ?? []),
  );
  return balance.efectivoEnCaja;
}
