import { and, asc, inArray, isNull, sql } from 'drizzle-orm';

import { sales } from '../schema/ledger.js';
import type { Db } from '../client.js';
import { condiciones, type FiltroMovimientos } from './movimientos-filtro.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * What Ventas y gastos says about the rows it is **not** showing: per
 * category (a venta's payment method, an egreso's category), how many rows
 * the table lists, what they add up to and on how many tickets.
 *
 * Aggregated in SQL for the filtered period (DB2-QRY-02): the screen used to
 * receive the tenant's entire history and sum it in the browser. One row per
 * category is enough to rebuild every tile — totals, contado and crédito,
 * the biggest category, nómina — the category chips, and the pager's total.
 *
 * The category filter is deliberately not applied here: the chips list every
 * category of the period, and the caller narrows the groups to the one
 * selected. A cancelled venta is listed (`filas`) but adds nothing to
 * `total` or `tickets` — money that did not happen.
 */
export interface GrupoMovimientos {
  readonly clasificacion: string;
  /** Rows the table lists for this category, cancelled ventas included. */
  readonly filas: number;
  /** Live money, centavos. */
  readonly total: bigint;
  /** Distinct live tickets (a venta) or rows (an egreso). */
  readonly tickets: number;
}

type Raw = { clasificacion: string | null; filas: string; total: string; tickets: string };

export async function resumenMovimientos(
  tx: Tx,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos = {},
): Promise<readonly GrupoMovimientos[]> {
  const where = condiciones(kind, filtro, false);
  const rows =
    kind === 'venta'
      ? await tx.execute<Raw>(sql`
          SELECT t.metodo AS clasificacion,
                 count(*)::text AS filas,
                 coalesce(sum(s.monto_centavos) FILTER (WHERE t.cancelled_at IS NULL), 0)::text AS total,
                 (count(DISTINCT s.ticket_id) FILTER (WHERE t.cancelled_at IS NULL))::text AS tickets
            FROM sales s JOIN tickets t ON t.id = s.ticket_id
           WHERE ${where}
           GROUP BY t.metodo`)
      : await tx.execute<Raw>(sql`
          SELECT e.categoria AS clasificacion, count(*)::text AS filas,
                 coalesce(sum(e.monto_centavos), 0)::text AS total, count(*)::text AS tickets
            FROM expenses e
           WHERE ${where}
           GROUP BY e.categoria`);
  return (
    [...rows]
      .map((r) => ({
        clasificacion: r.clasificacion ?? '',
        filas: Number(r.filas),
        total: BigInt(r.total),
        tickets: Number(r.tickets),
      }))
      // Code-unit order, as the chips were always sorted.
      .sort((a, b) => (a.clasificacion < b.clasificacion ? -1 : 1))
  );
}

/**
 * How many rows the table would list — the other tab's label. A plain count
 * of the driving table: no ticket join, so it stays an index range scan.
 */
export async function contarMovimientos(
  tx: Tx,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos = {},
): Promise<number> {
  const rows = await tx.execute<{ n: string }>(
    kind === 'venta'
      ? sql`SELECT count(*)::text AS n FROM sales s WHERE ${condiciones(kind, filtro)}`
      : sql`SELECT count(*)::text AS n FROM expenses e WHERE ${condiciones(kind, filtro)}`,
  );
  return Number(rows[0]?.n ?? 0);
}

/** A ticket's lines, for the drawer's «Lo que llevó». */
export interface LineaDeTicket {
  readonly id: string;
  readonly ticketId: string;
  readonly concepto: string;
  readonly amount: bigint;
}

/**
 * Every live line of the given tickets — the drawer shows a venta's whole
 * ticket, and a page of ten can cut one in two. `idx_sales_ticket` serves it.
 */
export async function lineasDeTickets(
  tx: Tx,
  ticketIds: readonly string[],
): Promise<readonly LineaDeTicket[]> {
  const ids = [...new Set(ticketIds)];
  if (ids.length === 0) return [];
  const rows = await tx
    .select({
      id: sales.id,
      ticketId: sales.ticketId,
      concepto: sales.concepto,
      amount: sales.monto,
    })
    .from(sales)
    .where(and(inArray(sales.ticketId, ids), isNull(sales.deletedAt)))
    .orderBy(asc(sales.id));
  return rows;
}
