/**
 * The phone's Ventas list as its board draws it (MvVentas): the title line,
 * the three compact figures, each row's lines in one phrase, the client only
 * on a fiado sale, and the row's accessible label (VoiceOver reads it, and
 * the Maestro flows match it). Rows in, words out.
 */
import { formatMoney } from '@xangarro/domain';

import { resumen } from './derive';
import type { VentaTurno } from './types';

/** A ticket line, as the row's phrase needs it (`Sale` satisfies it). */
interface LineaResumida {
  readonly concepto: string;
  readonly productoId: string;
  readonly cantidad: number;
}

/**
 * «2 Alambre · 2 Agua de horchata · 1 Café»: every product with its pieces,
 * in the order it was sold; a product rung up on two lines counts once.
 */
export function lineasResumen(lineas: readonly LineaResumida[]): string {
  const juntas = new Map<string, { nombre: string; piezas: number }>();
  for (const l of lineas) {
    // The product and its words: one product rung up twice joins, two
    // lines that only share an id (a renamed product) stay apart.
    const clave = `${l.productoId}\u0000${l.concepto}`;
    const previa = juntas.get(clave);
    if (previa) previa.piezas += l.cantidad;
    else juntas.set(clave, { nombre: l.concepto, piezas: l.cantidad });
  }
  return [...juntas.values()].map((j) => `${j.piezas} ${j.nombre}`).join(' · ');
}

/** The title's line: «12 en tu turno, desde las 08:15». */
export function enTuTurno(activas: number, desde: string): string {
  return desde === '' ? `${activas} en tu turno` : `${activas} en tu turno, desde las ${desde}`;
}

export interface CifraVentas {
  readonly k: 'Cobrado' | 'En efectivo' | 'Canceladas';
  readonly v: string;
  /** `efectivo` is drawn in the cash green. */
  readonly tono: 'neutro' | 'efectivo';
}

/** The board's compact summary; a cancelled sale counts only in «Canceladas». */
export function cifrasVentas(ventas: readonly VentaTurno[]): readonly CifraVentas[] {
  const r = resumen(ventas);
  return [
    { k: 'Cobrado', v: formatMoney(r.cobrado), tono: 'neutro' },
    { k: 'En efectivo', v: formatMoney(r.efectivo), tono: 'efectivo' },
    { k: 'Canceladas', v: String(r.canceladas), tono: 'neutro' },
  ];
}

/** The client the row names: only a fiado sale has one to say. */
export function clienteDeFila(v: VentaTurno): string | null {
  return v.metodo === 'Fiado' ? (v.cliente ?? null) : null;
}

/** «Ver venta V-0001, $35.00, Fiado, Don Pedro, cancelada». */
export function etiquetaFila(v: VentaTurno): string {
  const cliente = clienteDeFila(v);
  return [
    `Ver venta ${v.folio}`,
    formatMoney(v.monto),
    v.metodo,
    ...(cliente === null ? [] : [cliente]),
    ...(v.cancelada ? ['cancelada'] : []),
  ].join(', ');
}
