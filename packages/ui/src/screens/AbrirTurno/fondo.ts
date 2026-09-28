/**
 * The fondo as MvAbrirTurno's keypad builds it: digits, one decimal point,
 * two decimals, six whole digits at most (the web's `centavosDe` rule).
 * Money is parsed as text into centavos, never through a float. Pure.
 */
import { formatMoney } from '@xangarro/domain';

export type TeclaFondo = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'borrar';

export interface FondoEstado {
  /** What the operator typed, «800.00». */
  readonly raw: string;
  /** A chip or the suggestion filled it: the next digit starts over. */
  readonly nuevo: boolean;
}

/** The quick chips: $500, $1,000, $2,000, $5,000 (OpAbrirTurno). */
export const RAPIDOS: readonly bigint[] = [50_000n, 100_000n, 200_000n, 500_000n];

const ENTEROS = 6;

/** «800.00» from 80000 centavos. */
export const pesos = (c: bigint): string => `${c / 100n}.${String(c % 100n).padStart(2, '0')}`;

export const fondoDe = (c: bigint | null): FondoEstado => ({
  raw: c === null ? '' : pesos(c),
  nuevo: c !== null,
});

/** The typed fondo in centavos, or null while it is not an amount. */
export function centavosDe(raw: string): bigint | null {
  const m = /^(\d+)(?:\.(\d{0,2}))?$/.exec(raw);
  if (m === null) return null;
  return BigInt(m[1] ?? '0') * 100n + BigInt((m[2] ?? '').padEnd(2, '0'));
}

function digito(raw: string, d: string): string {
  const [ent = '', dec] = raw.split('.');
  if (dec !== undefined) return dec.length >= 2 ? raw : `${raw}${d}`;
  if (ent.length >= ENTEROS) return raw;
  return ent === '0' ? d : `${raw}${d}`;
}

export function teclearFondo(e: FondoEstado, t: TeclaFondo): FondoEstado {
  const raw = e.nuevo ? '' : e.raw;
  if (t === 'borrar') return { raw: raw.slice(0, -1), nuevo: false };
  if (t === '.') return { raw: raw.includes('.') ? raw : `${raw || '0'}.`, nuevo: false };
  return { raw: digito(raw, t), nuevo: false };
}

/** «1,234.5»: the whole part grouped, the decimals as typed. */
export function fondoVisible(raw: string): string {
  const [ent = '', dec] = raw.split('.');
  const grupos = (ent === '' ? '0' : String(BigInt(ent))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec === undefined ? grupos : `${grupos}.${dec}`;
}

/** «$1,000»: a chip's label. */
export const etiquetaRapido = (c: bigint): string => formatMoney(c).replace(/\.00$/, '');
