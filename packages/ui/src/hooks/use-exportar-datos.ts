/**
 * `useExportarDatos` — query wrapper around `ExportarDatosUseCase`
 * (Slice 3 C22).
 *
 * The use-case is read-only but slow (walks four years of months
 * across nine repositories). We expose it as a `useQuery` rather than
 * a mutation so the Settings screen can show a skeleton while it
 * runs and cache the result for a few minutes if the user re-opens
 * the flow.
 */

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ExportarDatosUseCase, type ExportDataset } from '@cachink/application';
import {
  useBusinessesRepository,
  useClientPaymentsRepository,
  useClientsRepository,
  useDayClosesRepository,
  useEmployeesRepository,
  useExpensesRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useRecurringExpensesRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface UseExportarDatosOptions {
  /**
   * When false, the query is skipped until the caller toggles it.
   * Used by the Settings screen to defer the (expensive) walk until
   * the user taps "Exportar".
   */
  readonly enabled?: boolean;
}

/** Thin accessor bundle so the main hook stays under the fn-lines budget. */
function useExportRepos(): ConstructorParameters<typeof ExportarDatosUseCase>[0] {
  return {
    businesses: useBusinessesRepository(),
    sales: useSalesRepository(),
    expenses: useExpensesRepository(),
    products: useProductsRepository(),
    inventoryMovements: useInventoryMovementsRepository(),
    employees: useEmployeesRepository(),
    clients: useClientsRepository(),
    clientPayments: useClientPaymentsRepository(),
    dayCloses: useDayClosesRepository(),
    recurringExpenses: useRecurringExpensesRepository(),
  };
}

export function useExportarDatos(
  options: UseExportarDatosOptions = {},
): UseQueryResult<ExportDataset, Error> {
  const repos = useExportRepos();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(() => new ExportarDatosUseCase(repos), [repos]);
  const enabled = (options.enabled ?? true) && businessId !== null;

  return useQuery<ExportDataset, Error>({
    queryKey: ['exportar-datos', businessId],
    enabled,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return useCase.execute({ businessId });
    },
  });
}
