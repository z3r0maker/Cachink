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
  openingBalanceClientsOf,
  openingBalanceOf,
  periodBalanceInputs,
  periodLedger,
  tickets as ticketsTable,
  valuacionApertura,
} from '@xangarro/data-pg';

import { between } from 'drizzle-orm';
import type { Ticket, TicketConTotal } from '@xangarro/domain';
import { withTenant, type Tx } from './db';

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
  /** The SAT régime code — names the base the estimate used (ADR-089). */
  readonly regimenSat: string | null;
  /** What each expandable line is made of — sums to the line (domain test). */
  readonly desglose: ReturnType<typeof desgloseDeResultados>;
}

const DIA_MS = 86_400_000;
const diasEntre = (from: string, to: string) =>
  Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / DIA_MS) + 1);

/** Distinct YYYY-MM in [from, to] — the SAT tables are monthly (ADR-089). */
const mesesEntre = (from: string, to: string): number => {
  const meses = new Set<string>();
  const cursor = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  while (cursor <= end) {
    meses.add(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return Math.max(1, meses.size);
};

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

type AperturaFacts = {
  readonly header: {
    readonly cajaCentavos: bigint;
    readonly bancosCentavos: bigint;
  };
  readonly lines: readonly { clienteId: string; saldoCentavos: bigint }[];
  readonly valuacionInventario: bigint;
};

async function loadApertura(tx: Tx, businessId: string): Promise<AperturaFacts | null> {
  const header = await openingBalanceOf(tx, businessId);
  if (header === null) return null;
  return {
    header,
    lines: await openingBalanceClientsOf(tx, businessId),
    valuacionInventario: await valuacionApertura(tx, businessId),
  };
}

/**
 * N-17: the day-one facts as the calculator wants them — efectivo = caja +
 * bancos, the CxC lines, and capitalInicial = everything the owner imported
 * (cash + CxC + the apertura movements' inventory valuation), so
 * Activo = Pasivo + Capital holds from statement one.
 */
function aperturaDe(apertura: AperturaFacts | null) {
  if (apertura === null) return undefined;
  return {
    efectivoInicial: apertura.header.cajaCentavos + apertura.header.bancosCentavos,
    cuentasPorCobrar: apertura.lines.map((l) => ({
      clienteId: l.clienteId,
      saldoCentavos: l.saldoCentavos,
    })),
    capitalInicial:
      apertura.header.cajaCentavos +
      apertura.header.bancosCentavos +
      apertura.lines.reduce((t, l) => t + l.saldoCentavos, 0n) +
      apertura.valuacionInventario,
  };
}

/** The cloud schema keys `monto_centavos` as `monto`, like the device and the
 * domain (drift.test.ts holds the keys equal). */
function aDominio(rows: Awaited<ReturnType<typeof periodLedger>>) {
  return {
    ventas: rows.ventas.map((r) => ({ ...r, monto: r.monto ?? 0n }) as unknown as Sale),
    egresos: rows.egresos.map((r) => ({ ...r, monto: r.monto ?? 0n }) as unknown as Expense),
  };
}

export async function loadEstadosModel(
  businessId: string,
  from: string,
  to: string,
): Promise<EstadosModel> {
  // One tenant transaction: the period's ledger, the balance's real inputs
  // (F-1), the apertura facts, and the régime + rate that decide the ISR
  // estimate (ADR-089).
  const { rows, inputs, isrTasa, regimenSat, apertura } = await withTenant(
    businessId,
    async (tx) => ({
      rows: await periodLedger(tx, from, to),
      inputs: await periodBalanceInputs(tx, from, to),
      isrTasa: (await getBusiness(tx))?.isrTasa ?? 0,
      regimenSat: (await getBusiness(tx))?.regimenSat ?? null,
      apertura: await loadApertura(tx, businessId),
    }),
  );

  const { ventas, egresos } = aDominio(rows);
  const resultados = calculateEstadoDeResultados({
    ventas,
    egresos,
    mermaMovements: inputs.merma as unknown as readonly InventoryMovement[],
    isrTasa,
    regimenSat: regimenSat ?? null,
    mesesEnPeriodo: mesesEntre(from, to),
  });
  const pagosClientes = inputs.pagos as unknown as readonly ClientPayment[];
  const tickets = await ticketsConTotal(businessId, from, to, ventas);
  const balance = calculateBalanceGeneral({
    cortesDelDia: inputs.cortes as unknown as readonly DayClose[],
    inventarioStock: inputs.stock,
    ventasConCredito: conCredito(tickets),
    pagosClientes,
    pasivosManuales: 0n,
    utilidadDelPeriodo: resultados.utilidadNeta,
    apertura: aperturaDe(apertura),
  });
  const flujo = calculateFlujoDeEfectivo({ ventas: tickets, egresos, pagosClientes });
  const indicadores = indicadoresDe(resultados, balance, tickets, from, to);

  const desglose = desgloseDeResultados({ ventas: tickets, egresos });
  return { resultados, balance, flujo, indicadores, isrTasa, regimenSat, desglose };
}
