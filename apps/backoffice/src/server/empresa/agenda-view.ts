import type { ObligacionVista } from '@xangarro/application/corp';
import type { LlamadaConEstado } from '@xangarro/data-corp';
import type { Estado, Plantilla } from '@xangarro/domain/corp';
import type { Route } from 'next';

import { diasEntre, fechaCorta } from './fechas';

/**
 * Agenda › Próximos in the board's words (E-04, board CD-05): what is late,
 * what is due in the next two weeks, and what comes later.
 */
export type Tono = 'ok' | 'warn' | 'bad' | 'info' | 'off';

export interface ItemAgenda {
  readonly key: string;
  readonly href: Route;
  readonly titulo: string;
  readonly fundamento: string;
  readonly autoridad: string;
  readonly fecha: string;
  readonly falta: string;
  readonly tarde: boolean;
  readonly estado: string;
  readonly tono: Tono;
}

export interface GrupoAgenda {
  readonly label: 'Vencidas' | 'Esta semana y la siguiente' | 'Más adelante';
  readonly items: readonly ItemAgenda[];
}

export function etiquetaEstado(p: Plantilla, estado: Estado, sinPago: boolean): string {
  if (estado === 'pagada') return sinPago ? 'Sin pago' : 'Pagada';
  if (estado === 'presentada') return p.etiquetaPresentada ?? 'Presentada';
  return estado === 'preparada' ? 'Preparada' : 'Pendiente';
}

const TONO: Record<Estado, Tono> = {
  pendiente: 'off',
  preparada: 'info',
  presentada: 'warn',
  pagada: 'ok',
};

export function falta(vence: string, hoy: string): string {
  const d = diasEntre(hoy, vence);
  if (d === 0) return 'vence hoy';
  if (d > 0) return d === 1 ? 'mañana' : `en ${d} días`;
  return d === -1 ? 'venció ayer' : `vencida hace ${-d} días`;
}

/** An obligation's detail page. */
export const hrefDe = (o: Pick<ObligacionVista, 'plantilla' | 'periodo'>): Route =>
  `/empresa/agenda/${o.plantilla.id}/${o.periodo}`;

export function itemDe(o: ObligacionVista, hoy: string): ItemAgenda {
  return {
    key: `${o.plantilla.id}~${o.periodo}`,
    href: hrefDe(o),
    titulo: o.titulo,
    fundamento: o.plantilla.fundamento,
    autoridad: o.plantilla.autoridad,
    fecha: fechaCorta(o.vence),
    falta: falta(o.vence, hoy),
    tarde: o.vence < hoy,
    estado: etiquetaEstado(o.plantilla, o.estado, o.sinPago),
    tono: o.vence < hoy && o.estado === 'pendiente' ? 'bad' : TONO[o.estado],
  };
}

const LEJOS_DIAS = 60;

/** Open items only, split by how soon; `extras` are the funding halves from Socios. */
export function grupos(
  vistas: readonly ObligacionVista[],
  hoy: string,
  extras: readonly (ItemAgenda & { readonly vence: string })[] = [],
): readonly GrupoAgenda[] {
  // Monthly periods only within 60 days; annual filings and one-off dates always.
  const cerca = (o: ObligacionVista) =>
    !/^\d{4}-\d{2}$/.test(o.periodo) || diasEntre(hoy, o.vence) <= LEJOS_DIAS;
  const abiertas = vistas
    .filter((o) => !o.cumplida && cerca(o))
    .map((o) => ({ ...itemDe(o, hoy), vence: o.vence }));
  const todas = [...abiertas, ...extras].sort((a, b) => a.vence.localeCompare(b.vence));
  const pronto = (v: string) => diasEntre(hoy, v) <= 14;
  return [
    { label: 'Vencidas' as const, items: todas.filter((i) => i.vence < hoy) },
    {
      label: 'Esta semana y la siguiente' as const,
      items: todas.filter((i) => i.vence >= hoy && pronto(i.vence)),
    },
    { label: 'Más adelante' as const, items: todas.filter((i) => !pronto(i.vence)) },
  ].filter((g) => g.items.length > 0);
}

/** The agreement's deadlines on the Agenda: each unpaid half of a funding call. */
export function itemsDeFondeo(
  calls: readonly LlamadaConEstado[],
  hoy: string,
): (ItemAgenda & { readonly vence: string })[] {
  return calls.flatMap((c) =>
    ([1, 2] as const)
      .filter((s) => c.mitades[s] === null)
      .map((s) => ({
        key: `fondeo~${c.id}~F${s}`,
        href: '/empresa/socios',
        titulo: `${c.concepto} (mitad de F${s})`,
        fundamento: 'Acuerdo de fundadores · cláusula Quinta',
        autoridad: 'Socios',
        fecha: fechaCorta(c.vence),
        falta: falta(c.vence, hoy),
        tarde: c.vence < hoy,
        estado: 'Pendiente',
        tono: c.vence < hoy ? ('bad' as const) : ('off' as const),
        vence: c.vence,
      })),
  );
}

const DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const diaDe = (iso: string) => DIA[new Date(`${iso}T12:00:00Z`).getUTCDay()] ?? '';

/** «El 17 cae en sábado, así que se recorre al lunes 19.» when a date moved. */
export function recorrido(nominal: string, vence: string): string | null {
  if (nominal === vence) return null;
  const n = Number(nominal.slice(8));
  const v = Number(vence.slice(8));
  const motivo = ['sábado', 'domingo'].includes(diaDe(nominal))
    ? `cae en ${diaDe(nominal)}`
    : 'es día inhábil';
  const verbo = vence > nominal ? 'se recorre al' : 'se adelanta al';
  return `El ${n} ${motivo}, así que ${verbo} ${diaDe(vence)} ${v}.`;
}
