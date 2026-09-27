import { sql, type SQL } from 'drizzle-orm';

import { inventoryMovements, products } from '../schema/catalog.js';
import { expenses, sales, tickets } from '../schema/ledger.js';
import type { Db } from '../client.js';
import { fechaEnDias } from './rango-fechas.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Runs one batch's reads in a tenant transaction — a fresh one per batch in the portal. */
export type EnTx = <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;

/** Every batch inside one transaction the caller already holds (tests, scripts). */
export const enTransaccion =
  (tx: Tx): EnTx =>
  (fn) =>
    fn(tx);

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
 *
 * Each batch runs in a transaction of its own, through the caller's
 * {@link EnTx} (DB3-EXP-01): an export that streams to a slow connection would
 * otherwise hold one transaction open — and a pooled connection with it — for
 * as long as the download takes, and trip the role's idle-in-transaction
 * timeout between batches. The keyset cursor, not a snapshot, is what keeps
 * the walk exact: a row written meanwhile is newer than the cursor and is
 * simply not part of this file.
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

/**
 * One batch: the rows to write, and the walk's own bookkeeping — how many rows
 * the driving table gave and the last of them. Kept apart because a batch may
 * write fewer rows than it read (a venta line whose ticket is missing), and a
 * short *file* batch must not end the walk, nor a skipped row move the cursor
 * backwards.
 */
interface Lote<R> {
  readonly filas: readonly R[];
  readonly leidas: number;
  readonly ultima: Cursor | undefined;
}

const loteDe = <R extends Cursor>(filas: readonly R[]): Lote<R> => ({
  filas,
  leidas: filas.length,
  ultima: filas.at(-1),
});

/** Batches until a short one, each keyed after the last row read by the one before. */
async function* porLotes<R>(
  leer: (cursor: Cursor | null) => Promise<Lote<R>>,
  lote: number,
): AsyncGenerator<readonly R[]> {
  let cursor: Cursor | null = null;
  for (;;) {
    const { filas, leidas, ultima } = await leer(cursor);
    if (filas.length > 0) yield filas;
    if (leidas < lote || ultima === undefined) return;
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

type RawLinea = { id: string; fecha: string; concepto: string; ticket_id: string; amount: string };
type RawTicket = { id: string; metodo: string; cancelada: boolean };

/** `'{a,b}'` — the ids as one array parameter, not 5,000 placeholders. ULIDs need no quoting. */
const arreglo = (ids: readonly string[]) => `{${ids.join(',')}}`;

/**
 * The batch's tickets, read over the batch's own days (DB3-EXP-01): joined to
 * the whole `tickets` table, every batch hashed all of the tenant's tickets
 * (22 of its 47 ms on the audit's whale, growing with history). A line whose
 * ticket carries another day is looked up by id alone, so the bound narrows
 * the read and never the file. A malformed stored day skips the bound.
 */
async function ticketsDelLote(tx: Tx, lineas: readonly RawLinea[]) {
  const dias = lineas.map((l) => l.fecha.slice(0, 10)).sort();
  const ids = [...new Set(lineas.map((l) => l.ticket_id))];
  let rango: SQL;
  try {
    rango = fechaEnDias(sql`t.fecha`, dias[0], dias.at(-1));
  } catch {
    rango = sql`true`;
  }
  const leer = async (buscar: readonly string[], dentro: SQL) =>
    tx.execute<RawTicket>(sql`
      SELECT t.id, t.metodo, (t.cancelled_at IS NOT NULL) AS cancelada
        FROM ${tickets} t WHERE t.id = ANY(${arreglo(buscar)}::text[]) AND ${dentro}`);
  const hallados = new Map([...(await leer(ids, rango))].map((t) => [t.id, t]));
  const faltan = ids.filter((id) => !hallados.has(id));
  if (faltan.length > 0) for (const t of await leer(faltan, sql`true`)) hallados.set(t.id, t);
  return hallados;
}

/**
 * Every live venta line, with its ticket's method and whether it was
 * cancelled. A line whose ticket does not exist is left out, as the join
 * always did.
 */
export function exportarVentas(enTx: EnTx, lote = LOTE_EXPORTACION) {
  return porLotes(
    (c) =>
      enTx(async (tx) => {
        const lineas = [
          ...(await tx.execute<RawLinea>(sql`
            SELECT s.id, s.fecha, s.concepto, s.ticket_id, s.monto_centavos::text AS amount
              FROM ${sales} s
             WHERE s.deleted_at IS NULL AND ${despues('s', c)}
             ORDER BY s.fecha DESC, s.id DESC LIMIT ${lote}`)),
        ];
        if (lineas.length === 0) return loteDe<FilaExportMovimiento>([]);
        const deTicket = await ticketsDelLote(tx, lineas);
        const filas = lineas.flatMap((l): FilaExportMovimiento[] => {
          const t = deTicket.get(l.ticket_id);
          if (t === undefined) return [];
          const { id, fecha, concepto } = l;
          return [
            {
              id,
              fecha,
              concepto,
              clasificacion: t.metodo,
              amount: BigInt(l.amount),
              cancelada: t.cancelada,
            },
          ];
        });
        return { filas, leidas: lineas.length, ultima: lineas.at(-1) };
      }),
    lote,
  );
}

/** Every live egreso. */
export function exportarGastos(enTx: EnTx, lote = LOTE_EXPORTACION) {
  return porLotes(async (c) => {
    const rows = await enTx((tx) =>
      tx.execute<RawMov>(sql`
      SELECT e.id, e.fecha, e.concepto, e.categoria AS clasificacion,
             e.monto_centavos::text AS amount, false AS cancelada
        FROM ${expenses} e
       WHERE e.deleted_at IS NULL AND ${despues('e', c)}
       ORDER BY e.fecha DESC, e.id DESC LIMIT ${lote}`),
    );
    return loteDe([...rows].map(aMovimiento));
  }, lote);
}

type RawInv = { [K in keyof FilaExportInventario]: FilaExportInventario[K] };

/** Every live inventory movement, with its product's name («—» if it is gone). */
export function exportarMovimientosInventario(enTx: EnTx, lote = LOTE_EXPORTACION) {
  return porLotes(async (c) => {
    const rows = await enTx((tx) =>
      tx.execute<RawInv>(sql`
      SELECT p.id, p.fecha, coalesce(pr.nombre, '—') AS producto, p.tipo, p.cantidad, p.motivo
        FROM (SELECT m.id, m.fecha, m.producto_id, m.tipo, m.cantidad, m.motivo
                FROM ${inventoryMovements} m
               WHERE m.deleted_at IS NULL AND ${despues('m', c)}
               ORDER BY m.fecha DESC, m.id DESC LIMIT ${lote}) p
        LEFT JOIN ${products} pr ON pr.id = p.producto_id
       ORDER BY p.fecha DESC, p.id DESC`),
    );
    return loteDe([...rows].map((r) => ({ ...r, cantidad: Number(r.cantidad) })));
  }, lote);
}

/** Drains a batched export into one array — for tests and small reads, never the portal's file. */
export async function todas<R>(lotes: AsyncIterable<readonly R[]>): Promise<readonly R[]> {
  const out: R[] = [];
  for await (const lote of lotes) out.push(...lote);
  return out;
}
