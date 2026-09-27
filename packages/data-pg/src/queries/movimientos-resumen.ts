import { and, asc, inArray, isNull, sql } from 'drizzle-orm';

import { sales } from '../schema/ledger.js';
import type { Db } from '../client.js';
import { condiciones, type FiltroMovimientos } from './movimientos-filtro.js';
import { fechaEnDias } from './rango-fechas.js';

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
 *
 * Ventas are summed **per ticket first**, and only those sums meet `tickets`,
 * read over the same days (audit DB3-QRY-03): joining every line to every
 * ticket the tenant ever had, then `count(DISTINCT)`, spilled to disk and grew
 * with history (124 ms a month, about 5 s at five years). A line whose ticket
 * carries another day is looked up by id, so the bound narrows the read and
 * never the totals; a line with no ticket at all is left out, as the join
 * always did.
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

/** A bound as the filter means it: blank is open on that side. */
const dia = (v: string | null | undefined): string | null => {
  const t = v?.trim() ?? '';
  return t === '' ? null : t;
};

function ventasPorMetodo(filtro: FiltroMovimientos) {
  const diasDelTicket = fechaEnDias(sql`t.fecha`, dia(filtro.desde), dia(filtro.hasta));
  return sql`
    SELECT coalesce(t.metodo, x.metodo) AS clasificacion,
           sum(pt.filas)::text AS filas,
           coalesce(sum(pt.total) FILTER (WHERE coalesce(t.cancelled_at, x.cancelled_at) IS NULL), 0)::text AS total,
           (count(*) FILTER (WHERE coalesce(t.cancelled_at, x.cancelled_at) IS NULL))::text AS tickets
      FROM (SELECT s.ticket_id, count(*) AS filas, sum(s.monto_centavos) AS total
              FROM sales s
             WHERE ${condiciones('venta', filtro, false)}
             GROUP BY s.ticket_id) pt
      LEFT JOIN tickets t ON t.id = pt.ticket_id AND ${diasDelTicket}
      LEFT JOIN LATERAL (SELECT t2.id, t2.metodo, t2.cancelled_at FROM tickets t2
                          WHERE t.id IS NULL AND t2.id = pt.ticket_id) x ON true
     WHERE t.id IS NOT NULL OR x.id IS NOT NULL
     GROUP BY 1`;
}

export async function resumenMovimientos(
  tx: Tx,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos = {},
): Promise<readonly GrupoMovimientos[]> {
  const where = condiciones(kind, filtro, false);
  const rows =
    kind === 'venta'
      ? await tx.execute<Raw>(ventasPorMetodo(filtro))
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
