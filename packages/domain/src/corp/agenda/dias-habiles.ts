import { FechaInvalidaError } from './errors.js';

/**
 * Business days for MEXIA's deadlines (E-04), as CFF art. 12 counts them:
 * Saturdays, Sundays and its listed days are not business days, and a
 * deadline that falls on one moves to the next business day.
 *
 * The SAT's own vacation periods (RMF 2.1.6) are left out on purpose: they do
 * not move the deadline of a declaration.
 */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function parse(fecha: string): Date {
  const m = ISO.exec(fecha);
  if (m === null) throw new FechaInvalidaError(fecha);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (d.toISOString().slice(0, 10) !== fecha) throw new FechaInvalidaError(fecha);
  return d;
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);

/** The `n`th Monday (1-based) of a month (1-12). */
function nthMonday(year: number, month: number, n: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (8 - first.getUTCDay()) % 7;
  return iso(new Date(Date.UTC(year, month - 1, 1 + offset + (n - 1) * 7)));
}

const cache = new Map<number, ReadonlySet<string>>();

/** CFF art. 12's days of a year, besides weekends. */
export function diasInhabiles(year: number): ReadonlySet<string> {
  const cached = cache.get(year);
  if (cached !== undefined) return cached;
  const dias = new Set([
    `${year}-01-01`,
    nthMonday(year, 2, 1),
    nthMonday(year, 3, 3),
    `${year}-05-01`,
    `${year}-05-05`,
    `${year}-09-16`,
    nthMonday(year, 11, 3),
    `${year}-12-25`,
  ]);
  // The transfer of the federal executive, every six years since 2024.
  if (year >= 2024 && (year - 2024) % 6 === 0) dias.add(`${year}-10-01`);
  cache.set(year, dias);
  return dias;
}

export function esDiaHabil(fecha: string): boolean {
  const d = parse(fecha);
  const dow = d.getUTCDay();
  return dow !== 0 && dow !== 6 && !diasInhabiles(d.getUTCFullYear()).has(fecha);
}

function step(fecha: string, dir: 1 | -1): string {
  return iso(new Date(parse(fecha).getTime() + dir * DAY_MS));
}

/** The date itself when it is a business day, else the next one. */
export function siguienteDiaHabil(fecha: string): string {
  let d = fecha;
  while (!esDiaHabil(d)) d = step(d, 1);
  return d;
}

/** The date itself when it is a business day, else the one before («durante marzo»). */
export function anteriorDiaHabil(fecha: string): string {
  let d = fecha;
  while (!esDiaHabil(d)) d = step(d, -1);
  return d;
}

/** `n` business days after `fecha`, not counting `fecha` itself. */
export function sumarDiasHabiles(fecha: string, n: number): string {
  let d = fecha;
  for (let left = n; left > 0; ) {
    d = step(d, 1);
    if (esDiaHabil(d)) left -= 1;
  }
  return d;
}
