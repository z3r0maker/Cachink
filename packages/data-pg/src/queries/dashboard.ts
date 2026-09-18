import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';

import { expenses, sales } from '../schema/ledger.js';
import { dayCloses } from '../schema/caja.js';
import { products, inventoryMovements } from '../schema/catalog.js';
import type { Db } from '../client.js';

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
      total: sql<string>`coalesce(sum(${sales.montoCentavos}), 0)`,
      n: sql<string>`count(*)`,
    })
    .from(sales)
    .where(
      and(
        gte(sales.fecha, from),
        lte(sales.fecha, to),
        isNull(sales.deletedAt),
        isNull(sales.cancelledAt),
      ),
    );

  const [g] = await tx
    .select({
      total: sql<string>`coalesce(sum(${expenses.montoCentavos}), 0)`,
      n: sql<string>`count(*)`,
    })
    .from(expenses)
    .where(and(gte(expenses.fecha, from), lte(expenses.fecha, to), isNull(expenses.deletedAt)));

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

/** The six most recent movements, ventas and gastos interleaved by time. */
export async function recentActivity(tx: Tx, limit = 6): Promise<readonly ActivityRow[]> {
  const rows = await tx.execute<{
    id: string;
    kind: 'venta' | 'gasto';
    concepto: string;
    tag: string;
    amount: string;
    at: string;
  }>(sql`
    SELECT id, 'venta' AS kind, concepto, metodo AS tag, monto_centavos::text AS amount, created_at::text AS at
      FROM ${sales} WHERE deleted_at IS NULL
    UNION ALL
    SELECT id, 'gasto' AS kind, concepto, categoria AS tag, monto_centavos::text AS amount, created_at::text AS at
      FROM ${expenses} WHERE deleted_at IS NULL
    ORDER BY at DESC
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
 */
export async function lowStock(tx: Tx): Promise<readonly LowStockRow[]> {
  const rows = await tx.execute<{ producto: string; stock: string; umbral: number }>(sql`
    SELECT p.nombre AS producto,
           COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN -m.cantidad ELSE m.cantidad END), 0)::text AS stock,
           p.umbral_stock_bajo AS umbral
      FROM ${products} p
      LEFT JOIN ${inventoryMovements} m
        ON m.producto_id = p.id AND m.deleted_at IS NULL
     WHERE p.deleted_at IS NULL AND p.seguir_stock
     GROUP BY p.id, p.nombre, p.umbral_stock_bajo
    HAVING COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN -m.cantidad ELSE m.cantidad END), 0)
             <= p.umbral_stock_bajo
     ORDER BY 2 ASC`);
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
