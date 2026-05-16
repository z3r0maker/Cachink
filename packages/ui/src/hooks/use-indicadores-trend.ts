/**
 * `useIndicadoresTrend` — fetches margin values for the previous 6 months
 * to power sparkline trend charts on the Indicadores dashboard.
 *
 * Exports the pure compose function + the React Query hook.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { BusinessId, IsoDate, PeriodRange } from '@cachink/domain';
import {
  useBusinessesRepository,
  useClientPaymentsRepository,
  useDayClosesRepository,
  useExpensesRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { composeIndicadores, type IndicadoresComposeDeps } from './use-indicadores';

export interface MarginTrend {
  readonly margenBruto: readonly number[];
  readonly margenOperativo: readonly number[];
  readonly margenNeto: readonly number[];
}

/**
 * Generate N monthly PeriodRanges ending at (and including) the month of
 * `base.to`. E.g., if base.to = 2026-04-30 and n=6, returns ranges for
 * Nov-2025, Dec-2025, Jan-2026, Feb-2026, Mar-2026, Apr-2026.
 */
export function previousNMonths(base: PeriodRange, n: number): PeriodRange[] {
  const [endYear, endMonth] = base.to.split('-').map(Number) as [number, number];
  const ranges: PeriodRange[] = [];

  for (let offset = n - 1; offset >= 0; offset--) {
    let y = endYear;
    let m = endMonth - offset;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const daysInMonth = new Date(y, m, 0).getDate();
    const from = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01` as IsoDate;
    const to =
      `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}` as IsoDate;
    ranges.push({ from, to });
  }

  return ranges;
}

/**
 * Strip leading null entries (months before the business had data).
 * Trailing nulls within a run of data are kept as 0 to preserve time shape.
 */
export function stripLeadingNulls(values: readonly (number | null)[]): readonly number[] {
  const firstNonNull = values.findIndex((v) => v !== null);
  if (firstNonNull === -1) return [];
  return values.slice(firstNonNull).map((v) => v ?? 0);
}

export async function composeIndicadoresTrend(
  deps: IndicadoresComposeDeps,
  businessId: BusinessId,
  currentPeriodo: PeriodRange,
): Promise<MarginTrend> {
  const months = previousNMonths(currentPeriodo, 6);
  const results = await Promise.all(months.map((p) => composeIndicadores(deps, businessId, p)));
  return {
    margenBruto: stripLeadingNulls(results.map((r) => r.margenBruto)),
    margenOperativo: stripLeadingNulls(results.map((r) => r.margenOperativo)),
    margenNeto: stripLeadingNulls(results.map((r) => r.margenNeto)),
  };
}

export interface UseIndicadoresTrendOptions {
  readonly periodo: PeriodRange;
}

export function useIndicadoresTrend(
  options: UseIndicadoresTrendOptions,
): UseQueryResult<MarginTrend, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const clientPayments = useClientPaymentsRepository();
  const dayCloses = useDayClosesRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<MarginTrend, Error>({
    queryKey: ['indicadores-trend', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000, // 5 min cache
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeIndicadoresTrend(
        { sales, expenses, businesses, clientPayments, dayCloses, products, movements },
        businessId,
        options.periodo,
      );
    },
  });
}
