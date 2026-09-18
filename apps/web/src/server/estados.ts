import 'server-only';

import {
  calculateBalanceGeneral,
  calculateEstadoDeResultados,
  calculateFlujoDeEfectivo,
  calculateIndicadores,
  desgloseDeResultados,
  type Expense,
  type Sale,
} from '@xangarro/domain';

import { getBusiness, periodLedger } from '@xangarro/data-pg';

import { withTenant } from './db';

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
  /** The business's own ISR rate (Negocio, P-08), in basis points. */
  readonly isrTasa: number;
  /** What each expandable line is made of — sums to the line (domain test). */
  readonly desglose: ReturnType<typeof desgloseDeResultados>;
}

const DIA_MS = 86_400_000;
const diasEntre = (from: string, to: string) =>
  Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / DIA_MS) + 1);

export async function loadEstadosModel(
  businessId: string,
  from: string,
  to: string,
): Promise<EstadosModel> {
  // One tenant transaction: the period's ledger and the rate the owner set.
  const { rows, isrTasa } = await withTenant(businessId, async (tx) => ({
    rows: await periodLedger(tx, from, to),
    isrTasa: (await getBusiness(tx))?.isrTasa ?? 0,
  }));

  // The cloud schema now keys `monto_centavos` as `monto`, like the device
  // and the domain (drift.test.ts holds the keys equal). Before, it said
  // `montoCentavos`, and an `as unknown as Sale[]` compiled fine and produced
  // `undefined` money, which surfaced as the error state.
  const ventas: readonly Sale[] = rows.ventas.map(
    (r) => ({ ...r, monto: r.monto ?? 0n }) as unknown as Sale,
  );
  const egresos: readonly Expense[] = rows.egresos.map(
    (r) => ({ ...r, monto: r.monto ?? 0n }) as unknown as Expense,
  );

  const resultados = calculateEstadoDeResultados({ ventas, egresos, isrTasa });

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
    periodoDiasVenta: diasEntre(from, to),
  });

  const desglose = desgloseDeResultados({ ventas, egresos });
  return { resultados, balance, flujo, indicadores, isrTasa, desglose };
}
