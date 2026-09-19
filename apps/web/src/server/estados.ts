import 'server-only';

import { conTotales } from '@xangarro/domain';
import {
  calculateBalanceGeneral,
  calculateEstadoDeResultados,
  calculateFlujoDeEfectivo,
  calculateIndicadores,
  desgloseDeResultados,
  sum,
  type ClientPayment,
  type DayClose,
  type Expense,
  type InventoryMovement,
  type Sale,
} from '@xangarro/domain';

import {
  getBusiness,
  periodBalanceInputs,
  periodLedger,
  tickets as ticketsTable,
} from '@xangarro/data-pg';

import { between } from 'drizzle-orm';
import type { Ticket, TicketConTotal } from '@xangarro/domain';
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

/** The phone's own filter (`use-balance-general`): Crédito or not fully paid. */
const conCredito = (tickets: readonly TicketConTotal[]) =>
  tickets.filter((v) => v.ticket.metodo === 'Crédito' || v.ticket.estadoPago !== 'pagado');

function indicadoresDe(
  resultados: EstadosModel['resultados'],
  balance: EstadosModel['balance'],
  tickets: readonly TicketConTotal[],
  from: string,
  to: string,
): EstadosModel['indicadores'] {
  return calculateIndicadores({
    estadoResultados: resultados,
    balanceGeneral: balance,
    // The phone's choice: the current snapshot serves as the average too.
    inventarioPromedio: balance.activo.inventarios,
    ventasCreditoPeriodoCentavos: sum(
      tickets.filter((v) => v.ticket.metodo === 'Crédito').map((v) => v.total),
    ),
    periodoDiasVenta: diasEntre(from, to),
  });
}

/** The period's tickets with derived totals (ADR-073), for method-level views. */
async function ticketsConTotal(
  businessId: string,
  from: string,
  to: string,
  ventas: readonly Sale[],
): Promise<readonly TicketConTotal[]> {
  return withTenant(businessId, async (tx) => {
    const tk = await tx
      .select()
      .from(ticketsTable)
      .where(between(ticketsTable.fecha, from, to));
    return conTotales(tk as unknown as readonly Ticket[], ventas);
  });
}

export async function loadEstadosModel(
  businessId: string,
  from: string,
  to: string,
): Promise<EstadosModel> {
  // One tenant transaction: the period's ledger, the balance's real inputs
  // (F-1) and the rate the owner set.
  const { rows, inputs, isrTasa } = await withTenant(businessId, async (tx) => ({
    rows: await periodLedger(tx, from, to),
    inputs: await periodBalanceInputs(tx, from, to),
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

  const resultados = calculateEstadoDeResultados({
    ventas,
    egresos,
    mermaMovements: inputs.merma as unknown as readonly InventoryMovement[],
    isrTasa,
  });
  const pagosClientes = inputs.pagos as unknown as readonly ClientPayment[];
  const tickets = await ticketsConTotal(businessId, from, to, ventas);
  const balance = calculateBalanceGeneral({
    cortesDelDia: inputs.cortes as unknown as readonly DayClose[],
    inventarioStock: inputs.stock,
    ventasConCredito: conCredito(tickets),
    pagosClientes,
    // Opening liabilities arrive with N-17 (saldos iniciales); none exist yet.
    pasivosManuales: 0n,
    utilidadDelPeriodo: resultados.utilidadNeta,
  });
  const flujo = calculateFlujoDeEfectivo({ ventas: tickets, egresos, pagosClientes });
  const indicadores = indicadoresDe(resultados, balance, tickets, from, to);

  const desglose = desgloseDeResultados({ ventas: tickets, egresos });
  return { resultados, balance, flujo, indicadores, isrTasa, desglose };
}
