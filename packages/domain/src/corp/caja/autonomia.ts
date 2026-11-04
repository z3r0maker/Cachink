import type { Money } from '../../money/index.js';
import type { AccountKey } from '../ledger/accounts.js';
import { MontoInvalidoError } from '../ledger/errors.js';

/**
 * «Autonomía sin nuevo capital» (E-16, board CD-12): can the operation go on
 * without the partners putting money in? Read off cash, not the P&L: what
 * the company can keep paying is what is in the bank.
 *
 * Cash is Bancos plus Stripe por depositar. Partner money (capital, AFAC,
 * loans and their refunds) counts in the cash on hand but never as income or
 * spending: a funding call would otherwise hide the burn it pays for.
 */
export const CUENTAS_CAJA = [
  'bancos',
  'stripe_por_depositar',
] as const satisfies readonly AccountKey[];

/** An entry touching any of these moves partner money. */
export const CUENTAS_SOCIOS = [
  'capital_social',
  'afac',
  'prestamos_socios',
] as const satisfies readonly AccountKey[];

export interface MovimientoCaja {
  /** The entry's day, `YYYY-MM-DD`. */
  readonly fecha: string;
  /** The entry's net effect on cash, centavos: positive in, negative out. */
  readonly importe: Money;
  /** The entry moves partner money (it touches capital, AFAC or a partner loan). */
  readonly socios: boolean;
}

export interface FlujoDelMes {
  readonly mes: string;
  /** Operating cash in, centavos. */
  readonly entra: Money;
  /** Operating cash out as a positive amount, centavos. */
  readonly sale: Money;
}

/** Cash on hand at the end of a day, partner money included. */
export function cajaAl(movs: readonly MovimientoCaja[], fecha: string): Money {
  return movs.reduce((t, m) => (m.fecha <= fecha ? t + m.importe : t), 0n);
}

/** Each month's operating cash in and out, partner money left aside. */
export function flujoMensual(
  movs: readonly MovimientoCaja[],
  meses: readonly string[],
): FlujoDelMes[] {
  return meses.map((mes) => {
    let entra = 0n;
    let sale = 0n;
    for (const m of movs) {
      if (m.socios || m.fecha.slice(0, 7) !== mes) continue;
      if (m.importe > 0n) entra += m.importe;
      else sale -= m.importe;
    }
    return { mes, entra, sale };
  });
}

export interface Autonomia {
  /** Cash at the cut, centavos. */
  readonly caja: Money;
  /** The months averaged: those since the company first had money. */
  readonly mesesConDatos: number;
  /** Monthly averages, centavos. */
  readonly entra: Money;
  readonly sale: Money;
  readonly neto: Money;
  /** Whether operating cash in covers cash out. Null without data. */
  readonly autosuficiente: boolean | null;
  /** «Si los ingresos se mantienen»: cash in 12 months, only when it grows. */
  readonly enDoceMeses: Money | null;
  /** «Si los ingresos bajan»: how far income may fall, basis points. */
  readonly caidaMaximaBps: number | null;
  /** The monthly income that covers what goes out (the break-even point). */
  readonly equilibrio: Money | null;
  /** Runway (plan §4): cash ÷ burn, one decimal. Null is «sin consumo». */
  readonly mesesDeCaja: number | null;
  /** «Si los ingresos se detuvieran hoy»: cash ÷ what goes out, one decimal. */
  readonly mesesSinIngresos: number | null;
}

/** Months of cash, truncated to one decimal; none left once cash is gone. */
const meses = (caja: Money, porMes: Money): number =>
  caja <= 0n ? 0 : Number((caja * 10n) / porMes) / 10;

function sinDatos(caja: Money): Autonomia {
  return {
    caja,
    mesesConDatos: 0,
    entra: 0n,
    sale: 0n,
    neto: 0n,
    autosuficiente: null,
    enDoceMeses: null,
    caidaMaximaBps: null,
    equilibrio: null,
    mesesDeCaja: null,
    mesesSinIngresos: null,
  };
}

/**
 * The hero at a cut (`YYYY-MM-DD`), averaging the given months (`YYYY-MM`,
 * normally the three before it). A month before the first movement is not
 * part of the company's history and is left out, never read as a zero.
 */
export function autonomia(
  movs: readonly MovimientoCaja[],
  corte: string,
  mesesPromedio: readonly string[],
): Autonomia {
  if (mesesPromedio.length === 0) {
    throw new MontoInvalidoError('la autonomía necesita al menos un mes');
  }
  const hasta = movs.filter((m) => m.fecha <= corte);
  const caja = cajaAl(hasta, corte);
  const primero = hasta.map((m) => m.fecha.slice(0, 7)).sort()[0];
  const validos = mesesPromedio.filter((m) => primero !== undefined && m >= primero);
  if (validos.length === 0) return sinDatos(caja);
  const flujo = flujoMensual(hasta, validos);
  const n = BigInt(validos.length);
  const entra = flujo.reduce((t, f) => t + f.entra, 0n) / n;
  const sale = flujo.reduce((t, f) => t + f.sale, 0n) / n;
  const neto = entra - sale;
  return {
    caja,
    mesesConDatos: validos.length,
    entra,
    sale,
    neto,
    autosuficiente: neto >= 0n,
    enDoceMeses: neto >= 0n ? caja + neto * 12n : null,
    caidaMaximaBps: neto >= 0n && entra > 0n ? Number((neto * 10_000n) / entra) : null,
    equilibrio: sale,
    mesesDeCaja: neto < 0n ? meses(caja, -neto) : null,
    mesesSinIngresos: sale > 0n ? meses(caja, sale) : null,
  };
}
