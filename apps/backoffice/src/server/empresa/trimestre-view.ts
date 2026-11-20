import { nombreTrimestre, trimestreDe } from '@xangarro/domain/corp';

/**
 * Socios › Trimestre's URL (E-17): `?t=2026-T3` picks the quarter, this one by
 * default, never one still to come.
 */
export const HREF_TRIMESTRE = '/empresa/trimestre';

export const hrefTrimestre = (t: string): string => `${HREF_TRIMESTRE}?t=${t}`;

export function parseTrimestre(t: string | undefined, hoy: string): string {
  const actual = trimestreDe(hoy);
  return t !== undefined && /^\d{4}-T[1-4]$/.test(t) && t <= actual && t >= '2000-T1' ? t : actual;
}

export interface Opcion {
  readonly label: string;
  readonly href: string | null;
  readonly actual: boolean;
}

/** The year chips, from the first year with entries to this one. */
export function anios(trimestre: string, primerAnio: number, hoy: string): Opcion[] {
  const ultimo = Number(hoy.slice(0, 4));
  const q = trimestre.slice(5);
  const out: Opcion[] = [];
  for (let y = Math.min(primerAnio, Number(trimestre.slice(0, 4))); y <= ultimo; y += 1) {
    const t = `${y}-${q}` <= trimestreDe(hoy) ? `${y}-${q}` : `${y}-T1`;
    out.push({ label: String(y), href: hrefTrimestre(t), actual: trimestre.startsWith(`${y}-`) });
  }
  return out;
}

/** The quarter chips of the year on screen; one still to come is not a link. */
export function cuartos(trimestre: string, hoy: string): Opcion[] {
  const y = trimestre.slice(0, 4);
  return [1, 2, 3, 4].map((n) => {
    const t = `${y}-T${n}`;
    return {
      label: nombreTrimestre(t).split(' ')[0] ?? t,
      href: t <= trimestreDe(hoy) ? hrefTrimestre(t) : null,
      actual: t === trimestre,
    };
  });
}
