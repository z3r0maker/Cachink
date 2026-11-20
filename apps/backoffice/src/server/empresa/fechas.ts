import { formatDate, formatMonth, parseIsoDate } from '@xangarro/domain';

/** «Empresa»'s day arithmetic on `YYYY-MM-DD` strings, at noon UTC so no zone shifts a day. */
const DAY_MS = 86_400_000;
const noon = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

/** Whole days from `a` to `b`. */
export function diasEntre(a: string, b: string): number {
  return Math.round((noon(b) - noon(a)) / DAY_MS);
}

export function sumarDias(fecha: string, n: number): string {
  return new Date(noon(fecha) + n * DAY_MS).toISOString().slice(0, 10);
}

/** «8 oct»: a date in this year's lists. */
export const fechaCorta = (iso: string) => formatDate(parseIsoDate(iso)).replace(/ \d{4}$/, '');

/** «octubre»: a month named in a sentence, `YYYY-MM`. */
export const nombreMes = (mes: string) => formatMonth(mes).split(' ')[0] ?? mes;

/** «30 de octubre»: a day named in a sentence. */
export const fechaLarga = (iso: string) =>
  `${Number(iso.slice(8, 10))} de ${nombreMes(iso.slice(0, 7))}`;

const DIA_MX = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' });

/** `YYYY-MM-DD`: the day an instant fell on in Mexico. */
export const fechaEnMexico = (at: string) => DIA_MX.format(new Date(at));

/** «12 nov»: the day an instant fell on in Mexico. */
export const diaDe = (at: string) => fechaCorta(fechaEnMexico(at));
