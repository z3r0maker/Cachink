import 'server-only';

import {
  calculateBalanceGeneral,
  calculateEstadoDeResultados,
  calculateFlujoDeEfectivo,
  calculateIndicadores,
  type Expense,
  type Sale,
} from '@xangarro/domain';

import { loadEstados } from './screens';

/**
 * The NIF statements, computed from **real ledger rows** by the existing
 * `@xangarro/domain` functions — the same code the phone runs (P-14).
 *
 * The container fetches; the domain computes; the screen renders. Nothing here
 * reimplements an accounting rule, which is what `tests/estados.test.ts`
 * asserts by recomputing and requiring identity.
 */
export interface EstadosModel {
  readonly resultados: ReturnType<typeof calculateEstadoDeResultados>;
  readonly balance: ReturnType<typeof calculateBalanceGeneral>;
  readonly flujo: ReturnType<typeof calculateFlujoDeEfectivo>;
  readonly indicadores: ReturnType<typeof calculateIndicadores>;
}

/** RESICO — 1.25%, in basis points, as the domain requires. */
const ISR_BPS = 125;

export async function loadEstadosModel(
  businessId: string,
  from: string,
  to: string,
): Promise<EstadosModel> {
  const rows = await loadEstados(businessId, from, to);

  // The database column is `monto_centavos`, which Drizzle surfaces as
  // `montoCentavos`; the domain entity calls the same value `monto`. Mapping
  // rather than casting is the point — an `as unknown as Sale[]` compiled
  // fine and produced `undefined` money, which surfaced as the error state.
  const ventas: readonly Sale[] = rows.ventas.map(
    (r) => ({ ...r, monto: r.montoCentavos ?? 0n }) as unknown as Sale,
  );
  const egresos: readonly Expense[] = rows.egresos.map(
    (r) => ({ ...r, monto: r.montoCentavos ?? 0n }) as unknown as Expense,
  );

  const resultados = calculateEstadoDeResultados({ ventas, egresos, isrTasa: ISR_BPS });

  const balance = calculateBalanceGeneral({
    cortesDelDia: [],
    inventarioStock: [],
    ventasConCredito: [],
    pagosClientes: [],
    pasivosManuales: 0n,
    utilidadDelPeriodo: resultados.utilidadNeta,
  });

  const flujo = calculateFlujoDeEfectivo({ ventas, egresos, pagosClientes: [] });

  const indicadores = calculateIndicadores({
    estadoResultados: resultados,
    balanceGeneral: balance,
    inventarioPromedio: 0n,
    ventasCreditoPeriodoCentavos: 0n,
    periodoDiasVenta: 31,
  });

  return { resultados, balance, flujo, indicadores };
}
