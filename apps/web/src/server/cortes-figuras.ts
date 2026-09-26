import 'server-only';

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  clientPayments,
  expenses as expensesTable,
  sales as salesTable,
  tickets as ticketsTable,
} from '@xangarro/data-pg';

import type { Tx } from './db';

/** Ticket count and line total per turno. */
export type Stats = Map<string, { n: number; monto: bigint }>;

export type Figuras = Awaited<ReturnType<typeof leerFiguras>>;

/**
 * All the per-turno figures the rows need, in three grouped queries, each
 * bounded by the page's turnos (DB2-QRY-02): the ticket stats in one pass with
 * FILTER clauses (they were three passes over the same tickets), the caja's
 * gastos per turno, and the Efectivo abonos of just the turnos' days — it used
 * to read every Efectivo abono the business ever received. Abonos stay keyed
 * by their exact `fecha`, as the rows look them up.
 */
export async function leerFiguras(
  tx: Tx,
  businessId: string,
  turnos: readonly { id: string; fecha: string }[],
) {
  const ids = turnos.map((t) => t.id);
  const dias = [...new Set(turnos.map((t) => t.fecha))];
  const [stats, gastosFilas, abonosFilas] = await Promise.all([
    statsPorTurno(tx, ids),
    tx
      .select({
        turno: expensesTable.cajaTurnoId,
        monto: sql<string>`sum(${expensesTable.monto})::text`,
      })
      .from(expensesTable)
      .where(and(inArray(expensesTable.cajaTurnoId, ids), isNull(expensesTable.deletedAt)))
      .groupBy(expensesTable.cajaTurnoId),
    tx
      .select({
        fecha: clientPayments.fecha,
        monto: sql<string>`sum(${clientPayments.montoCentavos})::text`,
      })
      .from(clientPayments)
      .where(
        and(
          eq(clientPayments.businessId, businessId),
          inArray(clientPayments.fecha, dias),
          eq(clientPayments.metodo, 'Efectivo'),
          isNull(clientPayments.deletedAt),
        ),
      )
      .groupBy(clientPayments.fecha),
  ]);
  const gastos = new Map<string, bigint>();
  for (const g of gastosFilas) if (g.turno !== null) gastos.set(g.turno, BigInt(g.monto));
  const abonos = new Map(abonosFilas.map((a) => [a.fecha, BigInt(a.monto)]));
  return { ...stats, gastos, abonos };
}

/**
 * Ticket counts and line-total sums per turno, for the stats card — live,
 * fiado (live Crédito) and cancelled, one pass. `count(ticket id)` over the
 * line join counts what it always did; money is cast to text and parsed.
 */
async function statsPorTurno(tx: Tx, ids: readonly string[]) {
  const vivo = sql`${ticketsTable.cancelledAt} IS NULL`;
  const fiado = sql`${ticketsTable.cancelledAt} IS NULL AND ${ticketsTable.metodo} = 'Crédito'`;
  const cancelado = sql`${ticketsTable.cancelledAt} IS NOT NULL`;
  const par = (cond: ReturnType<typeof sql>) => ({
    n: sql<string>`(count(${ticketsTable.id}) FILTER (WHERE ${cond}))::text`,
    monto: sql<string>`coalesce(sum(${salesTable.monto}) FILTER (WHERE ${cond}), 0)::text`,
  });
  const rows = await tx
    .select({
      turno: ticketsTable.cajaTurnoId,
      vivas: par(vivo),
      fiado: par(fiado),
      canceladas: par(cancelado),
    })
    .from(ticketsTable)
    .leftJoin(salesTable, eq(salesTable.ticketId, ticketsTable.id))
    .where(and(inArray(ticketsTable.cajaTurnoId, ids), isNull(ticketsTable.deletedAt)))
    .groupBy(ticketsTable.cajaTurnoId);
  const out = {
    vivas: new Map() as Stats,
    fiado: new Map() as Stats,
    canceladas: new Map() as Stats,
  };
  for (const r of rows) {
    if (r.turno === null) continue;
    for (const k of ['vivas', 'fiado', 'canceladas'] as const) {
      // A turno with none of a kind has no entry, as before: the readers default to 0.
      if (Number(r[k].n) > 0) out[k].set(r.turno, { n: Number(r[k].n), monto: BigInt(r[k].monto) });
    }
  }
  return out;
}
