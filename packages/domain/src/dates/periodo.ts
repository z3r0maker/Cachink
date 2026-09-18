import type { IsoDate } from './index.js';

/**
 * Periods for the portal's screens (P-09, P-13, P-14): "today" is the
 * business's date in Mexico City — a sale at 21:00 on the 12th is the 12th's,
 * even though UTC already says the 13th — and weeks start on Monday.
 */
export interface Rango {
  readonly desde: IsoDate;
  readonly hasta: IsoDate;
}

export const ZONA_NEGOCIO = 'America/Mexico_City';

const DIA_MS = 86_400_000;
const iso = (t: number): IsoDate => new Date(t).toISOString().slice(0, 10) as IsoDate;
const utc = (date: IsoDate): number => Date.parse(`${date}T00:00:00Z`);

/** Today in the business's time zone, as `YYYY-MM-DD`. */
export function hoyEn(now: Date = new Date(), zona: string = ZONA_NEGOCIO): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(now) as IsoDate;
}

export function rangoDelMes(date: IsoDate): Rango {
  const [y, m] = date.split('-').map(Number) as [number, number];
  return { desde: iso(Date.UTC(y, m - 1, 1)), hasta: iso(Date.UTC(y, m, 0)) };
}

export function rangoDeSemana(date: IsoDate): Rango {
  const t = utc(date);
  const desdeLunes = (new Date(t).getUTCDay() + 6) % 7;
  const lunes = t - desdeLunes * DIA_MS;
  return { desde: iso(lunes), hasta: iso(lunes + 6 * DIA_MS) };
}

export function nombreDelMes(date: IsoDate): string {
  const nombre = new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(
    utc(date),
  );
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${date.slice(0, 4)}`;
}

/** Whether `fecha` (a date or a timestamp) falls in the range, both ends included. */
export function enRango(fecha: string, rango: Rango): boolean {
  const dia = fecha.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  return dia >= rango.desde && dia <= rango.hasta;
}
