/**
 * `useEstadoResultados` — composes the pure
 * `calculateEstadoDeResultados` with the sales + expenses + businesses
 * repos over a PeriodRange (Slice 3 C10).
 *
 * Per the approved plan, egresos are gathered via `ExpensesRepository.findByMonth`
 * in a loop over every YYYY-MM the range spans. `SalesRepository.findByDateRange`
 * (added in C7) handles the ventas side in one call. ISR tasa is read
 * from the active business record.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  calculateEstadoDeResultados,
  type BusinessId,
  type EstadoDeResultados,
  type Expense,
  type IsoDate,
  type PeriodRange,
} from '@cachink/domain';
import type { BusinessesRepository, ExpensesRepository, SalesRepository } from '@cachink/data';
import { useBusinessesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface UseEstadoResultadosOptions {
  readonly periodo: PeriodRange;
}

/**
 * Pure composition — exported so screens and tests can drive the calc
 * without mounting a QueryClient.
 */
export async function composeEstadoResultados(
  sales: SalesRepository,
  expenses: ExpensesRepository,
  businesses: BusinessesRepository,
  businessId: BusinessId,
  periodo: PeriodRange,
): Promise<EstadoDeResultados> {
  const [ventas, business] = await Promise.all([
    sales.findByDateRange(periodo.from, periodo.to, businessId),
    businesses.findById(businessId),
  ]);
  if (!business) {
    throw new TypeError(`Business ${businessId} no existe`);
  }
  const egresos = await collectExpensesInRange(expenses, businessId, periodo);
  return calculateEstadoDeResultados({
    ventas,
    egresos,
    isrTasa: business.isrTasa,
  });
}

/**
 * Walk `findByMonth` across every YYYY-MM the range spans and trim the
 * result to the exact `[from, to]` window.
 */
export async function collectExpensesInRange(
  expenses: ExpensesRepository,
  businessId: BusinessId,
  periodo: PeriodRange,
): Promise<readonly Expense[]> {
  const months = monthsInRange(periodo.from, periodo.to);
  const all = await Promise.all(months.map((ym) => expenses.findByMonth(ym, businessId)));
  return all.flat().filter((e) => e.fecha >= periodo.from && e.fecha <= periodo.to);
}

/** Enumerate every `YYYY-MM` prefix between two `YYYY-MM-DD` dates, inclusive. */
export function monthsInRange(from: IsoDate, to: IsoDate): readonly string[] {
  const [fy, fm] = from.split('-').map(Number) as [number, number];
  const [ty, tm] = to.split('-').map(Number) as [number, number];
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function useEstadoResultados(
  options: UseEstadoResultadosOptions,
): UseQueryResult<EstadoDeResultados, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<EstadoDeResultados, Error>({
    queryKey: ['estado-resultados', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeEstadoResultados(sales, expenses, businesses, businessId, options.periodo);
    },
  });
}
