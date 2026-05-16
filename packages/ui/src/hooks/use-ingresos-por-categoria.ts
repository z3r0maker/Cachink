/**
 * `useIngresosPorCategoria` — groups sales by SaleCategory for the
 * Ingresos donut chart on the Estado de Resultados screen.
 *
 * Pattern mirrors `use-egresos-por-categoria.ts`.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  ZERO,
  type BusinessId,
  type Money,
  type PeriodRange,
  type SaleCategory,
} from '@cachink/domain';
import type { SalesRepository } from '@cachink/data';
import { useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface IngresoPorCategoria {
  readonly categoria: SaleCategory;
  readonly total: Money;
}

/**
 * Pure composition — groups sales by `categoria` within a period range.
 * Results are sorted descending by total.
 */
export async function composeIngresosPorCategoria(
  sales: SalesRepository,
  businessId: BusinessId,
  periodo: PeriodRange,
): Promise<readonly IngresoPorCategoria[]> {
  const ventas = await sales.findByDateRange(periodo.from, periodo.to, businessId);
  const map = new Map<SaleCategory, Money>();
  for (const v of ventas) {
    map.set(v.categoria, (map.get(v.categoria) ?? ZERO) + v.monto);
  }
  return [...map.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => Number(b.total - a.total));
}

export interface UseIngresosPorCategoriaOptions {
  readonly periodo: PeriodRange;
}

export function useIngresosPorCategoria(
  options: UseIngresosPorCategoriaOptions,
): UseQueryResult<readonly IngresoPorCategoria[], Error> {
  const sales = useSalesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly IngresoPorCategoria[], Error>({
    queryKey: ['ingresos-por-categoria', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeIngresosPorCategoria(sales, businessId, options.periodo);
    },
  });
}
