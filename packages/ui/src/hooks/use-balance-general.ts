/**
 * `useBalanceGeneral` — NIF B-6 (Slice 3 C12).
 *
 * Composes the period's cortes + current stock snapshot + Crédito ventas
 * + pagos + EstadoResultados.utilidadNeta and runs
 * `calculateBalanceGeneral`.
 *
 * ⚠ Known limitation called out in the plan risks (Slice 3 risk #3): the
 * inventory line uses the **current** stock snapshot — historical
 * end-of-period stock would require movement reconstruction. The ISR
 * disclaimer card explains this to the user.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  ZERO,
  calculateBalanceGeneral,
  type BalanceGeneral,
  type BusinessId,
  type PeriodRange,
} from '@cachink/domain';
import type {
  ClientPaymentsRepository,
  DayClosesRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
} from '@cachink/data';
import {
  useClientPaymentsRepository,
  useDayClosesRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { composeEstadoResultados } from './use-estado-resultados';
import { useBusinessesRepository } from '../app/index';
import { useExpensesRepository } from '../app/index';

export interface UseBalanceGeneralOptions {
  readonly periodo: PeriodRange;
}

export interface BalanceGeneralComposeDeps {
  readonly sales: SalesRepository;
  readonly clientPayments: ClientPaymentsRepository;
  readonly dayCloses: DayClosesRepository;
  readonly products: ProductsRepository;
  readonly movements: InventoryMovementsRepository;
}

/**
 * Pure composition — testable without mounting a QueryClient. The
 * caller hands in the repos plus a pre-computed `utilidadDelPeriodo`
 * (typically from composeEstadoResultados).
 */
export async function composeBalanceGeneral(
  deps: BalanceGeneralComposeDeps,
  businessId: BusinessId,
  periodo: PeriodRange,
  utilidadDelPeriodo: bigint,
): Promise<BalanceGeneral> {
  const [cortesDelPeriodo, ventasDelPeriodo, pagosDelPeriodo, productos] = await Promise.all([
    deps.dayCloses.findByDateRange(periodo.from, periodo.to, businessId),
    deps.sales.findByDateRange(periodo.from, periodo.to, businessId),
    deps.clientPayments.findByDateRange(periodo.from, periodo.to, businessId),
    deps.products.listForBusiness(businessId),
  ]);

  // Current-stock snapshot of inventory (see plan risk #3).
  const inventarioStock = await Promise.all(
    productos.map(async (p) => ({
      costoUnitCentavos: p.costoUnitCentavos,
      cantidad: await deps.movements.sumStock(p.id),
    })),
  );

  const ventasConCredito = ventasDelPeriodo.filter(
    (v) => v.metodo === 'Crédito' || v.estadoPago !== 'pagado',
  );

  return calculateBalanceGeneral({
    cortesDelDia: cortesDelPeriodo,
    inventarioStock,
    ventasConCredito,
    pagosClientes: pagosDelPeriodo,
    pasivosManuales: ZERO,
    utilidadDelPeriodo,
  });
}

export function useBalanceGeneral(
  options: UseBalanceGeneralOptions,
): UseQueryResult<BalanceGeneral, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const clientPayments = useClientPaymentsRepository();
  const dayCloses = useDayClosesRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<BalanceGeneral, Error>({
    queryKey: ['balance-general', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      const estado = await composeEstadoResultados(
        sales,
        expenses,
        businesses,
        businessId,
        options.periodo,
      );
      return composeBalanceGeneral(
        { sales, clientPayments, dayCloses, products, movements },
        businessId,
        options.periodo,
        estado.utilidadNeta,
      );
    },
  });
}
