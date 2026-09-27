/**
 * «Para hoy» over the caja's own rows (plan 11 §3.3): the recurring gastos
 * already due, the products at or below their threshold (Inventario's rule)
 * and the clients whose fiado is «Atrasado» (Fiado y abonos' rule). Pure, so
 * the order is tested without a Worker.
 *
 * Order: each kind sorted by urgency (the latest gasto, the emptiest shelf,
 * the biggest overdue debt), then taken in turns (gasto, reponer, cobrar) so
 * a short list still shows one of each. The screen shows the first
 * `MAX_TAREAS` still standing: a row put off with «Hoy no» makes room.
 */

import { formatMoney } from '@xangarro/domain';

import { abiertas, estadoCuenta } from '../cobranza/cliente/derive';
import type { CuentaCliente } from '../cobranza/cliente/types';
import { estado } from '../cobranza/derive';
import type { RecurrentePara } from '../lectura/turno-shapes';
import { OPERADOR_BASE } from '../rutas';
import { detalleRecurrente } from '../turno/vivo';
import type { Tarea } from './types';

/** The design's list holds four rows. */
export const MAX_TAREAS = 4;

/** A tracked product's stock, as Inventario reads it. */
export interface StockTarea {
  readonly id: string;
  readonly nombre: string;
  readonly existencias: number;
  readonly umbral: number;
}

const minuscula = (s: string): string => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;

/** Where «Registrar» opens Gastos' drawer already filled for this recurring gasto. */
export const hrefRecurrente = (id: string): string =>
  `${OPERADOR_BASE}/gastos?recurrente=${encodeURIComponent(id)}`;

/** «Registrar gas · Se repite cada semana» from a recurring expense already due. */
export const comoTarea = (r: RecurrentePara): Tarea => ({
  id: r.id,
  tipo: 'gasto',
  titulo: `Registrar ${minuscula(r.concepto)}`,
  detalle: `Se repite ${minuscula(detalleRecurrente(r))}`,
  href: hrefRecurrente(r.id),
});

/** Inventario's rule: at or below the threshold is «por reponer». */
export const porReponer = (s: StockTarea): boolean => s.existencias <= s.umbral;

/** «Reponer Refresco · Quedan 2 · el umbral es 10», opening its «Llegó mercancía». */
export function tareaStock(s: StockTarea): Tarea {
  return {
    id: `stock:${s.id}`,
    tipo: 'reponer',
    titulo: `Reponer ${s.nombre}`,
    detalle: `Quedan ${Math.max(0, s.existencias)} · el umbral es ${s.umbral}`,
    href: `${OPERADOR_BASE}/inventario?reponer=${encodeURIComponent(s.id)}`,
  };
}

/** «Cobrar a Doña Mari · Debe $860.00 · la venta más antigua es del 28 abr». */
export function tareaFiado(c: CuentaCliente): Tarea {
  const e = estadoCuenta(c);
  const dia = abiertas(c, e)[0]?.venta.dia;
  const desde =
    dia === undefined
      ? ''
      : ` · la venta más antigua es ${dia === 'hoy' ? 'de hoy' : `del ${dia}`}`;
  return {
    id: `fiado:${c.id}`,
    tipo: 'cobrar',
    titulo: `Cobrar a ${c.nombre}`,
    detalle: `Debe ${formatMoney(e.saldo)}${desde}`,
    href: `${OPERADOR_BASE}/cobranza/${encodeURIComponent(c.id)}`,
  };
}

/** Emptiest first: out of stock, then the lowest share of its threshold. */
const faltaDe = (s: StockTarea): number =>
  s.umbral <= 0 ? (s.existencias <= 0 ? 1 : 0) : 1 - Math.max(0, s.existencias) / s.umbral;

/** Take one of each kind in turns, keeping each kind's own order. */
export function alternar<T>(listas: readonly (readonly T[])[]): readonly T[] {
  const out: T[] = [];
  const largo = Math.max(0, ...listas.map((l) => l.length));
  for (let i = 0; i < largo; i += 1) {
    for (const l of listas) {
      const x = l[i];
      if (x !== undefined) out.push(x);
    }
  }
  return out;
}

/** Every task for today, most urgent first (the screen cuts it to `MAX_TAREAS`). */
export function tareasParaHoy(
  recurrentes: readonly RecurrentePara[],
  stock: readonly StockTarea[],
  cuentas: readonly CuentaCliente[],
): readonly Tarea[] {
  const gastos = [...recurrentes].sort((a, b) => a.vence - b.vence).map(comoTarea);
  const reponer = stock
    .filter(porReponer)
    .sort((a, b) => faltaDe(b) - faltaDe(a) || a.nombre.localeCompare(b.nombre, 'es-MX'))
    .map(tareaStock);
  const cobrar = cuentas
    .filter((c) => estado(c) === 'Atrasado')
    .sort((a, b) => Number(estadoCuenta(b).saldo - estadoCuenta(a).saldo))
    .map(tareaFiado);
  return alternar([gastos, reponer, cobrar]);
}
