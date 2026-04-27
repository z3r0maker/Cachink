/**
 * `useIndicadores` — assembles the six KPIs the Indicadores dashboard
 * surfaces (Slice 3 C16).
 *
 * Inputs are wired across the three estados hooks + an inventory
 * snapshot. Per CLAUDE.md §10 the domain calc takes plain numbers, so
 * the hook does the prep (inventarioPromedio, ventasCredito sum,
 * periodo days).
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  ZERO,
  calculateIndicadores,
  sum,
  type BusinessId,
  type Indicadores,
  type IsoDate,
  type Money,
  type PeriodRange,
  type Sale,
} from '@cachink/domain';
import type {
  BusinessesRepository,
  ClientPaymentsRepository,
  DayClosesRepository,
  ExpensesRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
} from '@cachink/data';
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
import { composeEstadoResultados } from './use-estado-resultados';
import { composeBalanceGeneral } from './use-balance-general';

export interface UseIndicadoresOptions {
  readonly periodo: PeriodRange;
}

export interface IndicadoresComposeDeps {
  readonly sales: SalesRepository;
  readonly expenses: ExpensesRepository;
  readonly businesses: BusinessesRepository;
  readonly clientPayments: ClientPaymentsRepository;
  readonly dayCloses: DayClosesRepository;
  readonly products: ProductsRepository;
  readonly movements: InventoryMovementsRepository;
}

export async function composeIndicadores(
  deps: IndicadoresComposeDeps,
  businessId: BusinessId,
  periodo: PeriodRange,
): Promise<Indicadores> {
  const estado = await composeEstadoResultados(
    deps.sales,
    deps.expenses,
    deps.businesses,
    businessId,
    periodo,
  );
  const balance = await composeBalanceGeneral(
    {
      sales: deps.sales,
      clientPayments: deps.clientPayments,
      dayCloses: deps.dayCloses,
      products: deps.products,
      movements: deps.movements,
    },
    businessId,
    periodo,
    estado.utilidadNeta,
  );

  // Inventario promedio = current snapshot (same as balance's line),
  // treated as both start and end for Phase 1C (risk #3 in the plan).
  const inventarioPromedio = balance.activo.inventarios;

  const ventasPeriodo = await deps.sales.findByDateRange(periodo.from, periodo.to, businessId);
  const ventasCreditoPeriodoCentavos = sumVentasCredito(ventasPeriodo);
  const periodoDiasVenta = diasInPeriodo(periodo.from, periodo.to);

  return calculateIndicadores({
    estadoResultados: estado,
    balanceGeneral: balance,
    inventarioPromedio,
    ventasCreditoPeriodoCentavos,
    periodoDiasVenta,
  });
}

export function sumVentasCredito(ventas: readonly Sale[]): Money {
  return ventas.length === 0
    ? ZERO
    : sum(ventas.filter((v) => v.metodo === 'Crédito').map((v) => v.monto));
}

/** Days from→to inclusive (min 1). */
export function diasInPeriodo(from: IsoDate, to: IsoDate): number {
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 1;
  const days = Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, days);
}

export function useIndicadores(options: UseIndicadoresOptions): UseQueryResult<Indicadores, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const clientPayments = useClientPaymentsRepository();
  const dayCloses = useDayClosesRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<Indicadores, Error>({
    queryKey: ['indicadores', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeIndicadores(
        {
          sales,
          expenses,
          businesses,
          clientPayments,
          dayCloses,
          products,
          movements,
        },
        businessId,
        options.periodo,
      );
    },
  });
}
