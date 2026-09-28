import type { IsoDate, Rango } from '@xangarro/domain';

import type { RangoChip } from './periodo';
import type { TabKey } from './url';

/**
 * The words around Ventas y gastos' numbers (DS-01): the period they refer to,
 * what an empty search says, and whether Personalizado is open enough to be
 * slow. Pure, so the copy is pinned by unit tests rather than by a browser.
 */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** `rangoDe`'s stand-ins for a Personalizado side left empty. */
const SIN_INICIO = '0000-01-01';
const SIN_FIN = '9999-12-31';

interface Dia {
  readonly anio: string;
  readonly mes: string;
  readonly dia: number;
}

const partes = (iso: string): Dia => ({
  anio: iso.slice(0, 4),
  mes: MESES[Number(iso.slice(5, 7)) - 1] ?? '',
  dia: Number(iso.slice(8, 10)),
});

const conAnio = (d: Dia) => `${d.dia} ${d.mes} ${d.anio}`;

/** «1–31 may», «28 ago–3 sep», «28 dic 2025–3 ene 2026»; the year only when it is not this one. */
export function tramo(r: Rango, hoy: IsoDate): string {
  const [a, b] = [partes(r.desde), partes(r.hasta)];
  if (r.desde === SIN_INICIO && r.hasta === SIN_FIN) return 'todo tu historial';
  if (r.desde === SIN_INICIO) return `hasta el ${conAnio(b)}`;
  if (r.hasta === SIN_FIN) return `desde el ${conAnio(a)}`;
  if (a.anio !== b.anio) return `${conAnio(a)}–${conAnio(b)}`;
  const anio = a.anio === hoy.slice(0, 4) ? '' : ` ${a.anio}`;
  if (r.desde === r.hasta) return `${a.dia} ${a.mes}${anio}`;
  if (a.mes === b.mes) return `${a.dia}–${b.dia} ${a.mes}${anio}`;
  return `${a.dia} ${a.mes}–${b.dia} ${b.mes}${anio}`;
}

/** «Periodo: 1–31 may», «Periodo: Hoy» — plus the search, which the numbers also follow. */
export function periodoCaption(chip: RangoChip, rango: Rango, hoy: IsoDate, q: string): string {
  const cual = chip === 'hoy' ? 'Hoy' : chip === 'semana' ? 'Esta semana' : tramo(rango, hoy);
  return `Periodo: ${cual}${q === '' ? '' : ` · con la búsqueda «${q}»`}`;
}

/**
 * An empty search's sentence, or null when nothing was searched (the screen's
 * own empty state stands). A folio is exact, so it is named as one.
 */
export function vacioDeBusqueda(tab: TabKey, q: string, folio: number | null): string | null {
  if (q === '') return null;
  if (folio !== null && tab === 'ventas') {
    return `No hay ninguna venta con el folio ${folio} en este periodo.`;
  }
  return `No hay movimientos con «${q}» en este periodo.`;
}

/** Personalizado with a side left open reads the history on that side: the search is slow. */
export const personalizadoAbierto = (chip: RangoChip, desde: string, hasta: string): boolean =>
  chip === 'personalizado' && (desde === '' || hasta === '');

/** «Ir a fecha»'s bounds: the period's own days, none on an open side. */
export function limitesDeFecha(r: Rango): { readonly min?: string; readonly max?: string } {
  return {
    ...(r.desde === SIN_INICIO ? {} : { min: r.desde }),
    ...(r.hasta === SIN_FIN ? {} : { max: r.hasta }),
  };
}
