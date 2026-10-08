import type { Money } from '../../money/index.js';
import { MontoInvalidoError, PeriodoCerradoError, TipoCambioInvalidoError } from './errors.js';
import type { JournalLine } from './movements.js';

/**
 * The ledger's other rules (E-02, ADR-124 §4): entries are never edited, a
 * closed month takes nothing, and a USD charge is posted in MXN at the rate of
 * its payment date.
 */

/** The lines that undo an entry: same accounts and partners, sides swapped. */
export function reverseLines(lines: readonly JournalLine[]): readonly JournalLine[] {
  return lines.map((l) => ({ ...l, debe: l.haber, haber: l.debe }));
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM` of an ISO date, or null when it is not one. */
export function periodOf(fecha: string): string | null {
  const m = ISO_DATE.exec(fecha);
  if (m === null) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${m[1]}-${m[2]}`;
}

/** Throws when the entry's month is closed (E-14) or its date is not a date. */
export function assertPeriodOpen(fecha: string, cerrados: ReadonlySet<string>): void {
  const period = periodOf(fecha);
  if (period === null || cerrados.has(period)) throw new PeriodoCerradoError(fecha);
}

const RATE = /^(\d{1,4})(?:\.(\d{1,6}))?$/;
const SCALE = 1_000_000n;

/** The rate as an integer number of millionths, never a float. */
function rateMicros(tipoCambio: string): bigint {
  const m = RATE.exec(tipoCambio.trim());
  if (m === null) throw new TipoCambioInvalidoError(tipoCambio);
  const micros = BigInt(m[1]!) * SCALE + BigInt((m[2] ?? '').padEnd(6, '0'));
  if (micros === 0n) throw new TipoCambioInvalidoError(tipoCambio);
  return micros;
}

/**
 * USD centavos → MXN centavos at `tipoCambio` (pesos per dollar, e.g. the DOF
 * FIX rate `"18.4217"`), rounded half up to the centavo. Integer arithmetic
 * only (CLAUDE.md §2.8).
 */
export function convertirAMxn(usdCentavos: Money, tipoCambio: string): Money {
  if (usdCentavos <= 0n) throw new MontoInvalidoError('el monto en dólares debe ser mayor a cero');
  const product = usdCentavos * rateMicros(tipoCambio);
  return (product + SCALE / 2n) / SCALE;
}
