/**
 * useExpectedCash — computes expected cash for a turno during close flow.
 *
 * Extracted from cerrar-caja-modal.tsx for the 40-line limit.
 */

import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno, Money } from '@xangarro/domain';
import { computeCajaBalance, ZERO } from '@xangarro/domain';
import {
  useSalesRepository,
  useTicketsRepository,
  useExpensesRepository,
  useCajaMovimientosRepository,
} from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { buildBalanceInput } from './build-balance-input';

/** Query one ledger source for the turno's day; empty until both keys exist. */
function useTurnoDay<T>(
  key: string,
  turno: CajaTurno | null,
  fetch: (fecha: string) => Promise<readonly T[]>,
): readonly T[] {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const fecha = turno?.fecha ?? '';
  const q = useQuery({
    queryKey: [key, turno?.id],
    queryFn: () => (businessId && turno ? fetch(fecha) : []),
    enabled: !!turno && !!businessId,
  });
  return (q.data ?? []) as readonly T[];
}

export function useExpectedCash(turno: CajaTurno | null): Money {
  const ticketsRepo = useTicketsRepository();
  const salesRepo = useSalesRepository();
  const expensesRepo = useExpensesRepository();
  const movRepo = useCajaMovimientosRepository();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const bid = (businessId ?? 'NONE') as never;

  const tickets = useTurnoDay('cerrar-tickets', turno, (f) =>
    ticketsRepo.findByDateRange(f, f, bid),
  );
  const sales = useTurnoDay('cerrar-sales', turno, (f) => salesRepo.findByDateRange(f, f, bid));
  const expenses = useTurnoDay('cerrar-expenses', turno, (f) =>
    expensesRepo.findByDateRange(f, f, bid),
  );
  const movQ = useQuery({
    queryKey: ['cerrar-movimientos', turno?.id],
    queryFn: () => (turno ? movRepo.findByTurno(turno.id) : []),
    enabled: !!turno,
  });

  if (!turno) return ZERO;

  const balance = computeCajaBalance(
    buildBalanceInput(turno, tickets, sales, expenses, movQ.data ?? []),
  );
  return balance.efectivoEnCaja;
}
