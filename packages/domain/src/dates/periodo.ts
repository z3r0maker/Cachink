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

/** `date` moved by `dias` days (negative goes back), across months and years. */
export function sumarDias(date: IsoDate, dias: number): IsoDate {
  return iso(utc(date) + dias * DIA_MS);
}

/** The `dias` days ending on `hasta`, both included — «Últimos 30 días». */
export function ultimosDias(hasta: IsoDate, dias: number): Rango {
  return { desde: sumarDias(hasta, -(dias - 1)), hasta };
}

export function rangoDelMes(date: IsoDate): Rango {
  const [y, m] = date.split('-').map(Number) as [number, number];
  return { desde: iso(Date.UTC(y, m - 1, 1)), hasta: iso(Date.UTC(y, m, 0)) };
}

/** The calendar quarter holding `date`: Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec. */
export function rangoDelTrimestre(date: IsoDate): Rango {
  const [y, m] = date.split('-').map(Number) as [number, number];
  const q = Math.floor((m - 1) / 3) * 3;
  return { desde: iso(Date.UTC(y, q, 1)), hasta: iso(Date.UTC(y, q + 3, 0)) };
}

/** The calendar year holding `date` — the fiscal year in Mexico. */
export function rangoDelAnio(date: IsoDate): Rango {
  const y = date.slice(0, 4);
  return { desde: `${y}-01-01` as IsoDate, hasta: `${y}-12-31` as IsoDate };
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

/**
 * The last day of `meses` calendar months starting on `desde`, both ends
 * included: 2025-05-01 + 13 → 2026-05-31; 2025-05-12 + 13 → 2026-06-11. A
 * start day the target month lacks is clamped to its end first, the way a
 * calendar reads «a month after 31 January».
 */
export function finDeMeses(desde: IsoDate, meses: number): IsoDate {
  if (!Number.isInteger(meses) || meses < 1) {
    throw new RangeError(`meses must be a positive integer, got ${meses}`);
  }
  const [y, m, d] = desde.split('-').map(Number) as [number, number, number];
  const diasDelMes = new Date(Date.UTC(y, m - 1 + meses + 1, 0)).getUTCDate();
  return iso(Date.UTC(y, m - 1 + meses, Math.min(d, diasDelMes)) - DIA_MS);
}

/**
 * The longest period the portal computes financial statements for (DB3-EST-01):
 * a multi-year «Personalizado» loaded the whole history into memory. Thirteen
 * months is a fiscal year plus the month either side of it.
 */
export const TOPE_MESES_ESTADOS = 13;

/** Whether a range spans at most `meses` calendar months (Estados' cap, DB3-EST-01). */
export function cabeEnMeses(rango: Rango, meses: number): boolean {
  return rango.desde <= rango.hasta && rango.hasta <= finDeMeses(rango.desde, meses);
}

/** Whether `fecha` (a date or a timestamp) falls in the range, both ends included. */
export function enRango(fecha: string, rango: Rango): boolean {
  const dia = fecha.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  return dia >= rango.desde && dia <= rango.hasta;
}
