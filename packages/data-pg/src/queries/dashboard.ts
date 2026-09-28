import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { expenses, sales, tickets } from '../schema/ledger.js';
import { dayCloses } from '../schema/caja.js';
import { products, inventoryMovements } from '../schema/catalog.js';
import type { Db } from '../client.js';
import { fechaEnDias } from './rango-fechas.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Dashboard reads.
 *
 * Every query is tenant-scoped by RLS, not by a `where business_id = …` the
 * caller might forget: the policy is the boundary and these run inside
 * `withBusiness`. A missing claim yields an empty result, never another
 * tenant's rows.
 *
 * Money stays `bigint` centavos all the way out — `sum()` returns text from
 * Postgres, so it is parsed back to `BigInt`, never to a float.
 */
const toCentavos = (v: unknown): bigint => (v === null || v === undefined ? 0n : BigInt(String(v)));

export interface DayTotals {
  readonly ventas: bigint;
  readonly gastos: bigint;
  readonly utilidad: bigint;
  readonly ventasCount: number;
  readonly gastosCount: number;
}

export async function totalsForRange(tx: Tx, from: string, to: string): Promise<DayTotals> {
  const [v] = await tx
    .select({
      total: sql<string>`coalesce(sum(${sales.monto}), 0)`,
      n: sql<string>`count(*)`,
    })
    .from(sales)
    .where(
      and(
        fechaEnDias(sales.fecha, from, to),
        isNull(sales.deletedAt),
        sql`NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = ${sales.ticketId} AND t.cancelled_at IS NOT NULL)`,
      ),
    );

  const [g] = await tx
    .select({
      total: sql<string>`coalesce(sum(${expenses.monto}), 0)`,
      n: sql<string>`count(*)`,
    })
    .from(expenses)
    .where(and(fechaEnDias(expenses.fecha, from, to), isNull(expenses.deletedAt)));

  const ventas = toCentavos(v?.total);
  const gastos = toCentavos(g?.total);
  return {
    ventas,
    gastos,
    utilidad: ventas - gastos,
    ventasCount: Number(v?.n ?? 0),
    gastosCount: Number(g?.n ?? 0),
  };
}

export interface ActivityRow {
  readonly id: string;
  readonly kind: 'venta' | 'gasto';
  readonly concepto: string;
  readonly tag: string;
  readonly amount: bigint;
  readonly at: string;
}

/**
 * The six most recent movements, ventas and gastos interleaved by time.
 *
 * Each branch takes its own newest `limit` rows **before** the union and
 * before the ticket join (audit DB2-QRY-03): a sort over the merged history
 * read every row the tenant ever captured (953 ms on the audit's whale), and
 * joining tickets ahead of the LIMIT lets an RLS-blind planner drive from the
 * wrong table. With `(business_id, created_at)` each branch is an index walk
 * of `limit` rows; without it, it is still one sort per table, not a join.
 */
export async function recentActivity(tx: Tx, limit = 6): Promise<readonly ActivityRow[]> {
  const rows = await tx.execute<{
    id: string;
    kind: 'venta' | 'gasto';
    concepto: string;
    tag: string;
    amount: string;
    at: string;
  }>(sql`
    SELECT id, kind, concepto, tag, amount, created_at::text AS at
      FROM (
        SELECT s.id, 'venta' AS kind, s.concepto, t.metodo AS tag,
               s.monto_centavos::text AS amount, s.created_at
          FROM (SELECT id, ticket_id, concepto, monto_centavos, created_at
                  FROM ${sales} WHERE deleted_at IS NULL
                 ORDER BY created_at DESC LIMIT ${limit}) s
          JOIN ${tickets} t ON t.id = s.ticket_id
        UNION ALL
        SELECT id, 'gasto' AS kind, concepto, categoria AS tag,
               monto_centavos::text AS amount, created_at
          FROM (SELECT id, concepto, categoria, monto_centavos, created_at
                  FROM ${expenses} WHERE deleted_at IS NULL
                 ORDER BY created_at DESC LIMIT ${limit}) e
      ) u
     ORDER BY created_at DESC
     LIMIT ${limit}`);

  return [...rows].map((r) => ({ ...r, amount: toCentavos(r.amount) }));
}

export interface LowStockRow {
  readonly producto: string;
  readonly stock: number;
  readonly umbral: number;
}

/**
 * Stock is **derived from movements**, never stored on the product — the same
 * rule the device follows, so the two cannot disagree.
 *
 * `cantidad` is always positive and the direction lives in `tipo`, so the sum
 * has to sign it. Summing `cantidad` raw would count every sale as a restock.
 *
 * The signed sum is computed once, in a subquery, and only the outer select
 * casts it to text. Writing it three times — select, HAVING, ORDER BY — is how
 * the ordering broke: `ORDER BY 2` pointed at the **cast** column, so Postgres
 * compared '12' against '3' as strings and put the better-stocked product
 * first. Scarcest-first is the whole point of the list, so the comparison has
 * to stay numeric. Ties break on the name, so the card does not reshuffle
 * between reads.
 *
 * The inner column is `stock_num`, not `stock`, for the same reason: a bare
 * `ORDER BY stock` resolves to the **output** alias — the text again — and
 * quietly restores the bug. A name the select list does not shadow cannot.
 *
 * The join spells out `business_id` so it is the `(business_id, producto_id)`
 * prefix a covering index on movements serves (DB2-QRY-05, see `lists.ts`).
 */
export async function lowStock(tx: Tx): Promise<readonly LowStockRow[]> {
  const rows = await tx.execute<{ producto: string; stock: string; umbral: number }>(sql`
    SELECT producto, stock_num::text AS stock, umbral
      FROM (
        SELECT p.nombre AS producto,
               COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN -m.cantidad ELSE m.cantidad END), 0) AS stock_num,
               p.umbral_stock_bajo AS umbral
          FROM ${products} p
          LEFT JOIN ${inventoryMovements} m
            ON m.business_id = p.business_id AND m.producto_id = p.id AND m.deleted_at IS NULL
         WHERE p.deleted_at IS NULL AND p.seguir_stock
         GROUP BY p.id, p.nombre, p.umbral_stock_bajo
      ) s
     WHERE stock_num <= umbral
     ORDER BY stock_num ASC, producto ASC`);
  return [...rows].map((r) => ({ producto: r.producto, stock: Number(r.stock), umbral: r.umbral }));
}

export interface CorteRow {
  readonly fecha: string;
  readonly diferencia: bigint;
}

export async function lastCortes(tx: Tx, limit = 2): Promise<readonly CorteRow[]> {
  const rows = await tx
    .select({ fecha: dayCloses.fecha, diferencia: dayCloses.diferenciaCentavos })
    .from(dayCloses)
    .where(isNull(dayCloses.deletedAt))
    .orderBy(desc(dayCloses.fecha))
    .limit(limit);
  return rows.map((r) => ({ fecha: r.fecha ?? '', diferencia: r.diferencia ?? 0n }));
}

export { eq };
