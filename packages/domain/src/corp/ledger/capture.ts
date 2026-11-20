import type { Money } from '../../money/index.js';
import type { AccountKey, CategoriaGasto } from './accounts.js';
import { tipoCambioDelCargo, enProporcion } from './cargo.js';
import { CargoMxnFaltanteError, MontoInvalidoError } from './errors.js';
import type { Gasto, JournalLine } from './movements.js';

/**
 * The capture screen's arithmetic (E-02): what a founder reads off a receipt
 * or a card statement, turned into a gasto, and a month's entries turned into
 * the three tiles above the list.
 */
export interface CapturaGasto {
  readonly categoria: CategoriaGasto;
  readonly moneda: 'MXN' | 'USD';
  /** What was paid, IVA included, in `moneda` centavos. */
  readonly total: Money;
  /** The IVA inside `total`, same currency; 0 when the receipt shows none. */
  readonly iva: Money;
  /** What the bank charged in pesos, its fee included; required for USD (E-42). */
  readonly cargoMxn: Money | null;
  readonly deducible: boolean;
}

export interface GastoCapturado {
  readonly movement: Gasto;
  readonly usd: { readonly montoOriginal: Money; readonly tipoCambio: string } | null;
}

function enPesos(c: CapturaGasto, monto: Money): Money {
  if (c.moneda === 'MXN') return monto;
  if (c.cargoMxn === null || c.cargoMxn <= 0n) throw new CargoMxnFaltanteError();
  return enProporcion(monto, c.total, c.cargoMxn);
}

/**
 * A paid expense, IVA split out. A USD charge is booked at what the bank
 * charged in pesos, and keeps its dollars and the rate that resulted (E-42).
 */
export function gastoDesdeCaptura(c: CapturaGasto): GastoCapturado {
  if (c.total <= 0n) throw new MontoInvalidoError('el monto debe ser mayor a cero');
  if (c.iva < 0n || c.iva >= c.total)
    throw new MontoInvalidoError('el IVA debe ser menor que el monto');
  const total = enPesos(c, c.total);
  const iva = enPesos(c, c.iva);
  return {
    movement: {
      kind: 'gasto',
      categoria: c.categoria,
      subtotal: total - iva,
      iva,
      tratamientoIva: c.deducible ? 'acreditable' : 'no_acreditable',
      retencionIsr: 0n,
      retencionIva: 0n,
      pagado: true,
    },
    usd:
      c.moneda === 'USD'
        ? { montoOriginal: c.total, tipoCambio: tipoCambioDelCargo(c.total, total) }
        : null,
  };
}

export interface EntradaDelMes {
  readonly id: string;
  readonly reversesEntryId: string | null;
  readonly lines: readonly JournalLine[];
}

export interface ResumenDelMes {
  /** Into the bank, centavos. */
  readonly entradas: Money;
  /** Out of the bank, centavos. */
  readonly salidas: Money;
  readonly neto: Money;
  /** The part of `entradas` the partners put in (capital, AFAC, loans). */
  readonly fondeoSocios: Money;
  /** Entries that still stand: a reversed one and its reversal are left out. */
  readonly movimientos: number;
}

const FONDEO: ReadonlySet<AccountKey> = new Set(['capital_social', 'afac', 'prestamos_socios']);

/** The month's bank movement. Reversal pairs cancel, so both drop out. */
export function resumenDelMes(entries: readonly EntradaDelMes[]): ResumenDelMes {
  const reversed = new Set(entries.flatMap((e) => (e.reversesEntryId ? [e.reversesEntryId] : [])));
  const standing = entries.filter((e) => e.reversesEntryId === null && !reversed.has(e.id));
  let entradas = 0n;
  let salidas = 0n;
  let fondeoSocios = 0n;
  for (const l of standing.flatMap((e) => e.lines)) {
    if (l.cuenta === 'bancos') {
      entradas += l.debe;
      salidas += l.haber;
    }
    if (FONDEO.has(l.cuenta)) fondeoSocios += l.haber;
  }
  return {
    entradas,
    salidas,
    neto: entradas - salidas,
    fondeoSocios,
    movimientos: standing.length,
  };
}
