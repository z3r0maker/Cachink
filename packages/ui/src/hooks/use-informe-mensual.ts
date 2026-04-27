/**
 * `useInformeMensual` — TanStack query wrapping
 * `GenerarInformeMensualUseCase` (Slice 3 C24).
 *
 * Input: `{ yearMonth: "YYYY-MM" }`. Output: `InformeMensual | null`.
 * `null` is never returned in happy paths — the hook surfaces error
 * states via the query's `error` channel — but the signature stays
 * nullable so the consumer can render an empty state without narrowing
 * gymnastics.
 */

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { GenerarInformeMensualUseCase, type InformeMensual } from '@cachink/application';
import { useBusinessesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;

export interface UseInformeMensualOptions {
  readonly yearMonth: string;
  readonly enabled?: boolean;
}

export function useInformeMensual(
  options: UseInformeMensualOptions,
): UseQueryResult<InformeMensual, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(
    () => new GenerarInformeMensualUseCase(sales, expenses, businesses),
    [sales, expenses, businesses],
  );

  const validYearMonth = YEAR_MONTH_RE.test(options.yearMonth);
  const enabled = (options.enabled ?? true) && businessId !== null && validYearMonth;

  return useQuery<InformeMensual, Error>({
    queryKey: ['informe-mensual', businessId, options.yearMonth],
    enabled,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      if (!validYearMonth) {
        throw new TypeError(`yearMonth must be in YYYY-MM format, got "${options.yearMonth}"`);
      }
      return useCase.execute({ businessId, yearMonth: options.yearMonth });
    },
  });
}
