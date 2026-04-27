/**
 * `useEfectivoEsperado` — TanStack query that feeds the Corte de Día
 * modal the pre-computed "esperado" amount (P1C-M7-T02, Slice 3 C2).
 *
 * Composes today's ventas + egresos + the previous corte's cierre and
 * runs the pure `calculateCorteDeDia` against `efectivoContado = 0`
 * so the UI can render the number before the user types.
 *
 * Business-scoped. Disabled when no business is selected — the corte
 * modal is never opened in that state but the hook stays safe either
 * way.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  calculateCorteDeDia,
  ZERO,
  type BusinessId,
  type IsoDate,
  type Money,
} from '@cachink/domain';
import type { DayClosesRepository, ExpensesRepository, SalesRepository } from '@cachink/data';
import { useDayClosesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface UseEfectivoEsperadoOptions {
  readonly fecha: IsoDate;
}

export interface EfectivoEsperadoResult {
  readonly esperado: Money;
}

/**
 * Pure composition — exported so tests can assert correctness without
 * mounting a QueryClient. The hook wraps this in `useQuery`.
 */
export async function composeEfectivoEsperado(
  sales: SalesRepository,
  expenses: ExpensesRepository,
  closes: DayClosesRepository,
  businessId: BusinessId,
  fecha: IsoDate,
): Promise<EfectivoEsperadoResult> {
  const [ventasHoy, egresosHoy, corteAnterior] = await Promise.all([
    sales.findByDate(fecha, businessId),
    expenses.findByDate(fecha, businessId),
    closes.findLatest(businessId),
  ]);
  const { esperado } = calculateCorteDeDia({
    ventasHoy,
    egresosHoy,
    saldoCierreAnterior: corteAnterior?.efectivoContadoCentavos ?? ZERO,
    efectivoContado: ZERO,
  });
  return { esperado };
}

export function useEfectivoEsperado(
  options: UseEfectivoEsperadoOptions,
): UseQueryResult<EfectivoEsperadoResult, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const closes = useDayClosesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<EfectivoEsperadoResult, Error>({
    queryKey: ['efectivo-esperado', businessId, options.fecha],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return { esperado: ZERO };
      return composeEfectivoEsperado(sales, expenses, closes, businessId, options.fecha);
    },
  });
}
