/**
 * Días hábiles in Mexico, for the legal clocks of ARCO requests (N-34).
 *
 * A día hábil is Monday to Friday, minus the rest days of Ley Federal del
 * Trabajo art. 74: 1 January, the first Monday of February, the third Monday
 * of March, 1 May, 16 September, the third Monday of November, 25 December,
 * and 1 October of each year the federal executive changes hands (2024,
 * 2030, …). LFPDPPP 2025 counts ARCO deadlines in días hábiles without its
 * own calendar; this one is the proposal for counsel (O-17).
 */

import type { IsoDate } from '../dates/index.js';
import { sumarDias } from '../dates/periodo.js';

const pad = (n: number) => String(n).padStart(2, '0');
const dateOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}` as IsoDate;

/** The `nth` Monday of `month` (1–12) in `year`. */
function nthMonday(year: number, month: number, nth: number): IsoDate {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const firstMonday = 1 + ((8 - firstDow) % 7);
  return dateOf(year, month, firstMonday + (nth - 1) * 7);
}

/** The LFT art. 74 rest days of `year`. */
export function diasDeDescanso(year: number): readonly IsoDate[] {
  const dias = [
    dateOf(year, 1, 1),
    nthMonday(year, 2, 1),
    nthMonday(year, 3, 3),
    dateOf(year, 5, 1),
    dateOf(year, 9, 16),
    nthMonday(year, 11, 3),
    dateOf(year, 12, 25),
  ];
  if (year >= 2024 && (year - 2024) % 6 === 0) dias.push(dateOf(year, 10, 1));
  return dias;
}

export function esDiaHabil(date: IsoDate): boolean {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !diasDeDescanso(Number(date.slice(0, 4))).includes(date);
}

/**
 * The `n`th día hábil after `desde` (which is not counted): the day a
 * deadline of `n` días hábiles falls on. `n` must be a positive integer.
 */
export function sumarDiasHabiles(desde: IsoDate, n: number): IsoDate {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`días hábiles inválidos: ${n}`);
  let fecha = desde;
  let contados = 0;
  while (contados < n) {
    fecha = sumarDias(fecha, 1);
    if (esDiaHabil(fecha)) contados += 1;
  }
  return fecha;
}
