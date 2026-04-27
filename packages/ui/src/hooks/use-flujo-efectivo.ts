/**
 * `useFlujoEfectivo` — NIF B-2 Flujo de Efectivo (Slice 3 C14).
 *
 * Composes ventas (cash-methods only + Crédito excluded), egresos
 * (via the monthly loop), and pagos from Crédito collections into
 * `calculateFlujoDeEfectivo`.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  calculateFlujoDeEfectivo,
  type BusinessId,
  type FlujoDeEfectivo,
  type PeriodRange,
} from '@cachink/domain';
import type { ClientPaymentsRepository, ExpensesRepository, SalesRepository } from '@cachink/data';
import {
  useClientPaymentsRepository,
  useExpensesRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { collectExpensesInRange } from './use-estado-resultados';

export interface UseFlujoEfectivoOptions {
  readonly periodo: PeriodRange;
}

/**
 * Pure composition. Returns the three flujo lines (operación, inversión,
 * total) — callers compose this with the periodo label to render the
 * NIF B-2 view.
 */
export async function composeFlujoEfectivo(
  sales: SalesRepository,
  expenses: ExpensesRepository,
  clientPayments: ClientPaymentsRepository,
  businessId: BusinessId,
  periodo: PeriodRange,
): Promise<FlujoDeEfectivo> {
  const [ventas, egresos, pagos] = await Promise.all([
    sales.findByDateRange(periodo.from, periodo.to, businessId),
    collectExpensesInRange(expenses, businessId, periodo),
    clientPayments.findByDateRange(periodo.from, periodo.to, businessId),
  ]);
  // calculateFlujoDeEfectivo already filters out Crédito via the
  // CASH_METHODS set; we pass raw ventas in.
  return calculateFlujoDeEfectivo({
    ventas,
    egresos,
    pagosClientes: pagos,
  });
}

export function useFlujoEfectivo(
  options: UseFlujoEfectivoOptions,
): UseQueryResult<FlujoDeEfectivo, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const clientPayments = useClientPaymentsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<FlujoDeEfectivo, Error>({
    queryKey: ['flujo-efectivo', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeFlujoEfectivo(sales, expenses, clientPayments, businessId, options.periodo);
    },
  });
}
