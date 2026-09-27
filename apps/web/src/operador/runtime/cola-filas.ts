/**
 * The outbox's rows grouped the way the operator captured them (O-27): a
 * ticket, its lines and its cancelación are one «Venta»; the inventory ledger
 * rows a sale or an entrada wrote fold into one «Movimientos de inventario»
 * line; everything else is one record per row.
 */

import { sql } from 'drizzle-orm';

import { LECTORES } from './cola-lectores';
import { filas, porLotes, type Lector } from './cola-sql';
import type { PendienteCrudo } from './cola-shapes';
import type { Db } from './db-types';

export interface Entrada {
  readonly tabla: string;
  readonly id: string;
  /** Tried at least once and on automatic retry (`unsentRows`' `retrying`). */
  readonly reintento?: boolean;
}

/** Rows that belong to a ticket, and the column that says which. */
const DE_TICKET = ['sales', 'cancelacion_logs'] as const;

/** `sales:<id>` / `cancelacion_logs:<id>` → the ticket they belong to. */
async function ticketsDe(db: Db, entradas: readonly Entrada[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const tabla of DE_TICKET) {
    const ids = entradas.filter((e) => e.tabla === tabla).map((e) => e.id);
    const rows = await porLotes(ids, (lote) =>
      filas<{ id: string; t: string }>(
        db,
        sql`SELECT id, ticket_id AS t FROM ${sql.raw(tabla)} WHERE id IN ${lote}`,
      ),
    );
    for (const r of rows) out.set(`${tabla}:${r.id}`, r.t);
  }
  return out;
}

export const clave = (e: Entrada): string => `${e.tabla}:${e.id}`;

/** Where a row is read from: its own table, its ticket, or the inventory fold. */
export function destino(e: Entrada, tickets: ReadonlyMap<string, string>): Entrada {
  if (e.tabla === 'inventory_movements') return { tabla: e.tabla, id: 'inventario' };
  const ticket = tickets.get(`${e.tabla}:${e.id}`);
  return ticket === undefined ? e : { tabla: 'tickets', id: ticket };
}

/** One entry per record, in the order the pusher meets them. */
export function ordenar(
  entradas: readonly Entrada[],
  tickets: ReadonlyMap<string, string>,
): { readonly orden: readonly Entrada[]; readonly ids: ReadonlyMap<string, string[]> } {
  const orden: Entrada[] = [];
  const ids = new Map<string, string[]>();
  const vistos = new Set<string>();
  for (const e of entradas) {
    const d = destino(e, tickets);
    const k = `${d.tabla}:${d.id}`;
    const lista = ids.get(d.tabla) ?? [];
    if (!ids.has(d.tabla)) ids.set(d.tabla, lista);
    lista.push(d.tabla === 'inventory_movements' ? e.id : d.id);
    if (vistos.has(k)) continue;
    vistos.add(k);
    orden.push(d);
  }
  return { orden, ids };
}

/** The records already retrying: any of their rows is (a ticket whose line failed). */
export function reintentosDe(
  entradas: readonly Entrada[],
  tickets: ReadonlyMap<string, string>,
): ReadonlySet<string> {
  return new Set(
    entradas.filter((e) => e.reintento === true).map((e) => clave(destino(e, tickets))),
  );
}

export async function agrupar(
  db: Db,
  entradas: readonly Entrada[],
): Promise<readonly PendienteCrudo[]> {
  const tickets = await ticketsDe(db, entradas);
  const { orden, ids } = ordenar(entradas, tickets);
  const reintentos = reintentosDe(entradas, tickets);
  const leidos = new Map<string, ReadonlyMap<string, PendienteCrudo>>();
  for (const [tabla, lista] of ids) {
    const lector: Lector | undefined = LECTORES[tabla];
    if (lector !== undefined) leidos.set(tabla, await lector(db, [...new Set(lista)]));
  }
  const out: PendienteCrudo[] = [];
  for (const d of orden) {
    const p = leidos.get(d.tabla)?.get(d.id);
    if (p !== undefined) out.push(reintentos.has(clave(d)) ? { ...p, reintento: true } : p);
  }
  return out;
}
