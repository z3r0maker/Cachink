import { sql, type SQL } from 'drizzle-orm';

import { inventoryMovements, products } from '../schema/catalog.js';
import { expenses, sales, tickets } from '../schema/ledger.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The portal's «Exportar» reads (P-34, audit DB2-EXP-01).
 *
 * An export is the whole history — «data is never held hostage» (CLAUDE.md
 * §2.2) — so these have **no** row limit. «Exportar movimientos» used to reuse
 * the Productos screen's list, which stops at 50, and silently shipped the
 * newest 50 movements as if they were all of them.
 *
 * They are read in keyset batches, newest first: each statement is one
 * `(fecha, id) < cursor … LIMIT n` walk that the `(business_id, fecha)` index
 * serves, so no single statement reads a year of rows against the 5 s
 * statement timeout, and no statement carries a per-row lookup (the ventas
 * list's old `sync_receipts` subquery). Each batch is cut first and joined
 * after (DB2-QRY-03).
 */
export const LOTE_EXPORTACION = 5000;

interface Cursor {
  readonly fecha: string;
  readonly id: string;
}

export interface FilaExportMovimiento {
  readonly id: string;
  readonly fecha: string;
  readonly concepto: string;
  readonly clasificacion: string;
  /** Centavos. */
  readonly amount: bigint;
  readonly cancelada: boolean;
}

export interface FilaExportInventario {
  readonly id: string;
  readonly fecha: string;
  readonly producto: string;
  readonly tipo: string;
  /** Always positive; the direction is `tipo`. */
  readonly cantidad: number;
  readonly motivo: string;
}

const despues = (alias: string, c: Cursor | null): SQL =>
  c === null
    ? sql`true`
    : sql`(${sql.raw(alias)}.fecha, ${sql.raw(alias)}.id) < (${c.fecha}, ${c.id})`;

/** Batches until a short one, each keyed after the last row of the one before. */
async function* porLotes<R extends Cursor>(
  leer: (cursor: Cursor | null) => Promise<readonly R[]>,
  lote: number,
): AsyncGenerator<readonly R[]> {
  let cursor: Cursor | null = null;
  for (;;) {
    const filas = await leer(cursor);
    if (filas.length > 0) yield filas;
    const ultima = filas.at(-1);
    if (filas.length < lote || ultima === undefined) return;
    cursor = { fecha: ultima.fecha, id: ultima.id };
  }
}

type RawMov = {
  id: string;
  fecha: string;
  concepto: string;
  clasificacion: string;
  amount: string;
  cancelada: boolean;
};

const aMovimiento = (r: RawMov): FilaExportMovimiento => ({ ...r, amount: BigInt(r.amount) });

/** Every live venta line, with its ticket's method and whether it was cancelled. */
export function exportarVentas(tx: Tx, lote = LOTE_EXPORTACION) {
  return porLotes(async (c) => {
    const rows = await tx.execute<RawMov>(sql`
      SELECT p.id, p.fecha, p.concepto, t.metodo AS clasificacion,
             p.monto_centavos::text AS amount, (t.cancelled_at IS NOT NULL) AS cancelada
        FROM (SELECT s.id, s.fecha, s.concepto, s.ticket_id, s.monto_centavos
                FROM ${sales} s
               WHERE s.deleted_at IS NULL AND ${despues('s', c)}
               ORDER BY s.fecha DESC, s.id DESC LIMIT ${lote}) p
        JOIN ${tickets} t ON t.id = p.ticket_id
       ORDER BY p.fecha DESC, p.id DESC`);
    return [...rows].map(aMovimiento);
  }, lote);
}

/** Every live egreso. */
export function exportarGastos(tx: Tx, lote = LOTE_EXPORTACION) {
  return porLotes(async (c) => {
    const rows = await tx.execute<RawMov>(sql`
      SELECT e.id, e.fecha, e.concepto, e.categoria AS clasificacion,
             e.monto_centavos::text AS amount, false AS cancelada
        FROM ${expenses} e
       WHERE e.deleted_at IS NULL AND ${despues('e', c)}
       ORDER BY e.fecha DESC, e.id DESC LIMIT ${lote}`);
    return [...rows].map(aMovimiento);
  }, lote);
}

type RawInv = { [K in keyof FilaExportInventario]: FilaExportInventario[K] };

/** Every live inventory movement, with its product's name («—» if it is gone). */
export function exportarMovimientosInventario(tx: Tx, lote = LOTE_EXPORTACION) {
  return porLotes(async (c) => {
    const rows = await tx.execute<RawInv>(sql`
      SELECT p.id, p.fecha, coalesce(pr.nombre, '—') AS producto, p.tipo, p.cantidad, p.motivo
        FROM (SELECT m.id, m.fecha, m.producto_id, m.tipo, m.cantidad, m.motivo
                FROM ${inventoryMovements} m
               WHERE m.deleted_at IS NULL AND ${despues('m', c)}
               ORDER BY m.fecha DESC, m.id DESC LIMIT ${lote}) p
        LEFT JOIN ${products} pr ON pr.id = p.producto_id
       ORDER BY p.fecha DESC, p.id DESC`);
    return [...rows].map((r) => ({ ...r, cantidad: Number(r.cantidad) }));
  }, lote);
}

/** Drains a batched export into one array — what the one-sheet builder takes. */
export async function todas<R>(lotes: AsyncIterable<readonly R[]>): Promise<readonly R[]> {
  const out: R[] = [];
  for await (const lote of lotes) out.push(...lote);
  return out;
}
