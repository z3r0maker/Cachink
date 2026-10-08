import type { Money } from '../../money/index.js';
import { MontoInvalidoError } from '../ledger/errors.js';
import type { JournalLine, MovementKind, Socio } from '../ledger/movements.js';
import { ReembolsoExcedeSaldoError, TrimestreInvalidoError } from './errors.js';

/**
 * The founders' agreement, clause Quinta, as pure functions (E-03): equal
 * funding calls, additional money counted 1:1 up to the quarter's cap with the
 * excess becoming a loan, and loans without interest. The agreement wins
 * where this module and it differ.
 */

/** Additional money over the quarter's finished deliverables is a loan, not pool value. */
export function repartoDelDinero(
  adicional: Money,
  entregables: Money,
): { readonly bolsa: Money; readonly prestamo: Money } {
  if (adicional < 0n) throw new MontoInvalidoError('la aportación no puede ser negativa');
  if (entregables < 0n) throw new MontoInvalidoError('los entregables no pueden ser negativos');
  const bolsa = adicional < entregables ? adicional : entregables;
  return { bolsa, prestamo: adicional - bolsa };
}

/** Each partner's half of a funding call; an odd centavo rounds up so the call is covered. */
export function mitad(total: Money): Money {
  if (total <= 0n) throw new MontoInvalidoError('el fondeo debe ser mayor a cero');
  return (total + 1n) / 2n;
}

const TRIMESTRE = /^(\d{4})-T([1-4])$/;
const FECHA = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/;

/** `2026-T4` for any day of October to December 2026. */
export function trimestreDe(fecha: string): string {
  const m = FECHA.exec(fecha);
  if (m === null) throw new TrimestreInvalidoError(fecha);
  return `${m[1]}-T${Math.ceil(Number(m[2]) / 3)}`;
}

function parse(trimestre: string): readonly [number, number] {
  const m = TRIMESTRE.exec(trimestre);
  if (m === null) throw new TrimestreInvalidoError(trimestre);
  return [Number(m[1]), Number(m[2])];
}

/** `[first day, first day of the next quarter)`. */
export function rangoDelTrimestre(trimestre: string): readonly [string, string] {
  const [year, q] = parse(trimestre);
  const month = (n: number) => String(n).padStart(2, '0');
  const end = q === 4 ? `${year + 1}-01-01` : `${year}-${month(q * 3 + 1)}-01`;
  return [`${year}-${month(q * 3 - 2)}-01`, end];
}

/** `4T 2026`: how the boards and the agreement name a quarter. */
export function nombreTrimestre(trimestre: string): string {
  const [year, q] = parse(trimestre);
  return `${q}T ${year}`;
}

const ULTIMO_DIA = ['03-31', '06-30', '09-30', '12-31'] as const;

/** The quarter's last day: where its close is dated. */
export function ultimoDiaDelTrimestre(trimestre: string): string {
  const [year, q] = parse(trimestre);
  return `${year}-${ULTIMO_DIA[q - 1] ?? '12-31'}`;
}

export function trimestreAnterior(trimestre: string): string {
  const [year, q] = parse(trimestre);
  return q === 1 ? `${year - 1}-T4` : `${year}-T${q - 1}`;
}

/** A repayment never exceeds what the company owes that partner. */
export function assertReembolsoCabe(saldo: Money, monto: Money): void {
  if (monto <= 0n) throw new MontoInvalidoError('el reembolso debe ser mayor a cero');
  if (monto > saldo) throw new ReembolsoExcedeSaldoError(saldo, monto);
}

export interface CuentaSocio {
  readonly capital: Money;
  /** Halves of funding calls: no pool value. */
  readonly fondeo: Money;
  /** Additional money still in AFAC: pool value up to each quarter's cap. */
  readonly adicional: Money;
  /** What the company owes the partner: loans plus moved excess, minus repayments. */
  readonly prestamo: Money;
  readonly reembolsado: Money;
}

export interface EntradaSocio {
  readonly kind: MovementKind;
  readonly lines: readonly JournalLine[];
}

type Mutable = { -readonly [K in keyof CuentaSocio]: Money };

const zero = (): Mutable => ({
  capital: 0n,
  fondeo: 0n,
  adicional: 0n,
  prestamo: 0n,
  reembolsado: 0n,
});

function apply(c: Mutable, kind: MovementKind, l: JournalLine): void {
  const credit = l.haber - l.debe;
  if (l.cuenta === 'capital_social') c.capital += credit;
  if (l.cuenta === 'afac') {
    if (kind === 'fondeo_mitades') c.fondeo += credit;
    else c.adicional += credit;
  }
  if (l.cuenta === 'prestamos_socios') {
    c.prestamo += credit;
    if (kind === 'reembolso_socio') c.reembolsado -= credit;
  }
}

/**
 * Each partner's balances from the ledger. A reversal carries its original's
 * kind with the sides swapped, so summing signed amounts nets it out.
 */
export function cuentasDeSocios(
  entries: readonly EntradaSocio[],
): Readonly<Record<Socio, CuentaSocio>> {
  const cuentas: Record<Socio, Mutable> = { 1: zero(), 2: zero() };
  for (const e of entries) {
    for (const l of e.lines) {
      if (l.socio !== undefined) apply(cuentas[l.socio], e.kind, l);
    }
  }
  return cuentas;
}
