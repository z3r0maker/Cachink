/**
 * The read side of a comprobante (N-20): one ticket with its sale lines,
 * shaped for the domain renderer. Money stays bigint centavos; the folio
 * is the display form («V-0405», ADR-073) and the stamp combines the
 * ticket's date and device hour in fixed Mexico City offset (no DST
 * since 2022, so -06:00 is exact).
 */

import { desc, eq, isNull } from 'drizzle-orm';

import { sales, tickets } from '../schema/index';
import type { Db } from '../client';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export interface LineaComprobante {
  readonly concepto: string;
  readonly cantidad: number;
  readonly importe: bigint;
}

export interface TicketComprobante {
  readonly folio: string;
  readonly fechaHora: string;
  readonly metodo: string;
  readonly total: bigint;
  readonly lineas: readonly LineaComprobante[];
  readonly cancelada: boolean;
}

/** Display folio per ADR-073: V- + the per-device counter padded to 4. */
export function folioDisplay(folio: number): string {
  return `V-${String(folio).padStart(4, '0')}`;
}

export async function ticketParaComprobante(
  conn: Conn,
  ticketId: string,
): Promise<TicketComprobante | null> {
  const [ticket] = await conn
    .select({
      folio: tickets.folio,
      fecha: tickets.fecha,
      hora: tickets.hora,
      metodo: tickets.metodo,
      canceladoAt: tickets.cancelledAt,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (ticket === undefined) return null;
  const lineas = await conn
    .select({
      concepto: sales.concepto,
      cantidad: sales.cantidad,
      importe: sales.monto,
    })
    .from(sales)
    .where(eq(sales.ticketId, ticketId))
    .orderBy(sales.fecha, sales.id);
  const vivas = lineas.map((l) => ({
    concepto: l.concepto,
    cantidad: l.cantidad,
    importe: l.importe,
  }));
  return {
    folio: folioDisplay(ticket.folio),
    fechaHora: `${ticket.fecha}T${ticket.hora ?? '12:00'}:00-06:00`,
    metodo: ticket.metodo,
    total: vivas.reduce((suma, l) => suma + l.importe, 0n),
    lineas: vivas.slice(0, 3),
    cancelada: ticket.canceladoAt !== null,
  };
}

/** The business's most recent live ticket, for previews. */
export async function ultimoTicketComprobante(conn: Conn): Promise<TicketComprobante | null> {
  const [row] = await conn
    .select({ id: tickets.id })
    .from(tickets)
    .where(isNull(tickets.cancelledAt))
    .orderBy(desc(tickets.fecha), desc(tickets.folio))
    .limit(1);
  if (row === undefined) return null;
  return ticketParaComprobante(conn, row.id);
}
