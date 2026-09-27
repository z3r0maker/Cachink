import { and, isNull, sql } from 'drizzle-orm';

import { tickets } from '../schema/ledger.js';
import type { Db } from '../client.js';
import { fechaEnDias } from './rango-fechas.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * What the financial statements read for a period (audit DB3-EST-01), summed
 * in SQL as far as the domain lets them be.
 *
 * `periodLedger` shipped every live sale **line** and every egreso of the
 * period to Node, `SELECT *`: 375K rows and +530 MB before any domain work for
 * a year of the audit's whale. The statements never look at a line on its own:
 *
 * - ventas are only ever summed — in total (`ingresos`) and per ticket
 *   (`conTotales`) — so one row per ticket carrying its lines' sum gives the
 *   domain the same numbers;
 * - egresos are only ever summed per `categoria` (costo de ventas, gastos
 *   operativos, the Flujo's inversión, the desglose), so one row per category
 *   does too;
 * - tickets are needed one by one (method, payment state, client, date — the
 *   Balance's fiado is per client), but only those five columns.
 *
 * Money arrives as the driver's text and is parsed with `BigInt` (ADR-094).
 */

/** Live lines of the period's live, uncancelled tickets, summed per ticket. Centavos. */
export interface VentaPorTicket {
  readonly ticketId: string;
  readonly monto: bigint;
}

/** Live egresos of the period, summed per category. Centavos. */
export interface EgresoPorCategoria {
  readonly categoria: string;
  readonly monto: bigint;
}

/**
 * The same set `periodLedger` reads — live lines, minus cancelled tickets'
 * lines, by day — so `ingresos` is unchanged to the centavo, orphan lines
 * included. `idx_sales_…_live` serves the range.
 */
export async function ventasPorTicket(
  tx: Tx,
  desde: string,
  hasta: string,
): Promise<readonly VentaPorTicket[]> {
  const rows = await tx.execute<{ ticket_id: string; monto: string }>(sql`
    SELECT s.ticket_id, coalesce(sum(s.monto_centavos), 0)::text AS monto
      FROM sales s
     WHERE s.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = s.ticket_id AND t.cancelled_at IS NOT NULL)
       AND ${fechaEnDias(sql`s.fecha`, desde, hasta)}
     GROUP BY s.ticket_id`);
  return [...rows].map((r) => ({ ticketId: r.ticket_id, monto: BigInt(r.monto) }));
}

export async function egresosPorCategoria(
  tx: Tx,
  desde: string,
  hasta: string,
): Promise<readonly EgresoPorCategoria[]> {
  const rows = await tx.execute<{ categoria: string; monto: string }>(sql`
    SELECT e.categoria, coalesce(sum(e.monto_centavos), 0)::text AS monto
      FROM expenses e
     WHERE e.deleted_at IS NULL AND ${fechaEnDias(sql`e.fecha`, desde, hasta)}
     GROUP BY e.categoria`);
  return [...rows].map((r) => ({ categoria: r.categoria, monto: BigInt(r.monto) }));
}

/**
 * The period's live tickets, by day (DB3-QRY-04): `between` missed a ticket
 * stamped with a time on the last day and kept deleted ones, so Estados and
 * the other screens could disagree about the same period.
 */
export async function ticketsDelPeriodo(tx: Tx, desde: string, hasta: string) {
  return tx
    .select({
      id: tickets.id,
      fecha: tickets.fecha,
      metodo: tickets.metodo,
      estadoPago: tickets.estadoPago,
      clienteId: tickets.clienteId,
      createdAt: tickets.createdAt,
      cancelledAt: tickets.cancelledAt,
      deletedAt: tickets.deletedAt,
    })
    .from(tickets)
    .where(and(isNull(tickets.deletedAt), fechaEnDias(tickets.fecha, desde, hasta)));
}
