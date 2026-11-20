import {
  nombreTrimestre,
  rangoDelTrimestre,
  trimestreAnterior,
  trimestreDe,
  trimestreSiguiente,
  ultimoDiaDelTrimestre,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';

/**
 * The Tablero's URL (E-20, boards CD-13b to CD-13d): `?t=2026-T4` picks the
 * quarter (this one by default, at most the next one's plan), `?ver=` the
 * filter chip, and a drawer opens with `?panel=`, `?tarjeta=` or `?objetivo=`.
 */
export const HREF_TABLERO = '/empresa/tablero';

export const FILTROS = ['todo', 'f1', 'f2', 'entregables', 'tareas', 'obligaciones'] as const;
export type Filtro = (typeof FILTROS)[number];

export const PANELES = ['nueva', 'plan', 'nuevo-objetivo', 'clausula', 'aviso'] as const;
export type PanelTablero = (typeof PANELES)[number];

export interface ParamsTablero {
  readonly trimestre: string;
  readonly ver: Filtro;
  readonly panel: PanelTablero | null;
  readonly tarjeta: string | null;
  readonly objetivo: string | null;
}

const TRIMESTRE = /^\d{4}-T[1-4]$/;

const de = <T extends string>(lista: readonly T[], v: string | undefined): T | null =>
  lista.find((x) => x === v) ?? null;

export function parseTablero(
  sp: Readonly<Record<string, string | undefined>>,
  hoy: string,
): ParamsTablero {
  const actual = trimestreDe(hoy);
  const t = sp.t ?? '';
  const valido = TRIMESTRE.test(t) && t <= trimestreSiguiente(actual) && t >= '2020-T1';
  return {
    trimestre: valido ? t : actual,
    ver: de(FILTROS, sp.ver) ?? 'todo',
    panel: de(PANELES, sp.panel),
    tarjeta: sp.tarjeta === undefined || sp.tarjeta === '' ? null : sp.tarjeta,
    objetivo: sp.objetivo === undefined || sp.objetivo === '' ? null : sp.objetivo,
  };
}

export function hrefTablero(
  trimestre: string,
  extra: {
    readonly ver?: Filtro;
    readonly panel?: PanelTablero;
    readonly tarjeta?: string;
    readonly objetivo?: string;
  } = {},
): string {
  const q = new URLSearchParams({ t: trimestre });
  if (extra.ver !== undefined && extra.ver !== 'todo') q.set('ver', extra.ver);
  if (extra.panel !== undefined) q.set('panel', extra.panel);
  if (extra.tarjeta !== undefined) q.set('tarjeta', extra.tarjeta);
  if (extra.objetivo !== undefined) q.set('objetivo', extra.objetivo);
  return `${HREF_TABLERO}?${q.toString()}`;
}

/** «Tablero · 4T 2026 · 1 oct a 31 dic». */
export function periodoDe(trimestre: string): string {
  const [desde] = rangoDelTrimestre(trimestre);
  const hasta = ultimoDiaDelTrimestre(trimestre);
  return `Tablero · ${nombreTrimestre(trimestre)} · ${fechaCorta(desde)} a ${fechaCorta(hasta)}`;
}

/** The arrows: back to any quarter, forward to the next one's plan at most. */
export function vecinos(trimestre: string, hoy: string) {
  const siguiente = trimestreSiguiente(trimestre);
  return {
    anterior: trimestreAnterior(trimestre),
    siguiente: siguiente <= trimestreSiguiente(trimestreDe(hoy)) ? siguiente : null,
  };
}

export const iniciales = (s: 1 | 2): string => `F${s}`;
