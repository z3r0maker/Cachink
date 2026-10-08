import 'server-only';

import {
  cabeEnMeses,
  tipoPersona,
  TOPE_MESES_ESTADOS,
  type Expense,
  type IsoDate,
  type Sale,
  type Ticket,
} from '@xangarro/domain';
import {
  egresosPorCategoria,
  getBusiness,
  openingBalanceClientsOf,
  openingBalanceOf,
  periodBalanceInputs,
  ticketsDelPeriodo,
  valuacionApertura,
  ventasPorTicket,
} from '@xangarro/data-pg';

import { withTenant, type Tx } from './db';

/**
 * Everything the statements read for a period, in **one** tenant transaction
 * (DB3-QRY-04: the tickets used to be read in a second one, so a sale landing
 * between the two made the statements disagree with themselves).
 *
 * Ventas arrive summed per ticket and egresos per category (DB3-EST-01,
 * `estados-periodo.ts` in data-pg says why that is all the domain needs), and
 * are handed to it in its own shapes: a per-ticket sum is a `Sale` of that
 * ticket for every function that reads one, and a per-category sum an
 * `Expense` of that category.
 */
export class RangoExcedidoError extends Error {
  readonly code = 'RANGO_EXCEDIDO' as const;
  constructor(desde: string, hasta: string) {
    super(`Estados computes at most ${TOPE_MESES_ESTADOS} months; asked ${desde}..${hasta}`);
    this.name = 'RangoExcedidoError';
  }
}

export type AperturaFacts = {
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

const comoVentas = (rows: Awaited<ReturnType<typeof ventasPorTicket>>) =>
  rows.map((r) => ({ ticketId: r.ticketId, monto: r.monto, deletedAt: null }) as unknown as Sale);

const comoEgresos = (rows: Awaited<ReturnType<typeof egresosPorCategoria>>) =>
  rows.map((r) => ({ categoria: r.categoria, monto: r.monto }) as unknown as Expense);

/**
 * The period's facts. Refuses a range past the cap before touching the
 * database — the page never asks for one, and nothing else may either.
 */
export async function leerPeriodo(businessId: string, desde: string, hasta: string) {
  const rango = { desde: desde as IsoDate, hasta: hasta as IsoDate };
  if (!cabeEnMeses(rango, TOPE_MESES_ESTADOS)) {
    throw new RangoExcedidoError(desde, hasta);
  }
  return withTenant(businessId, async (tx) => {
    const ventas = comoVentas(await ventasPorTicket(tx, desde, hasta));
    const egresos = comoEgresos(await egresosPorCategoria(tx, desde, hasta));
    const tickets = (await ticketsDelPeriodo(tx, desde, hasta)) as unknown as readonly Ticket[];
    const inputs = await periodBalanceInputs(tx, desde, hasta);
    // One read of the business for both fields — it was two (DB2-PAGE-01).
    const negocio = await getBusiness(tx);
    return {
      ventas,
      egresos,
      tickets,
      inputs,
      isrTasa: negocio?.isrTasa ?? 0,
      regimenSat: negocio?.regimenSat ?? null,
      // 626 is open to both personas and taxes them differently (ADR-125).
      persona: negocio?.rfc ? tipoPersona(negocio.rfc) : null,
      apertura: await loadApertura(tx, businessId),
    };
  });
}
