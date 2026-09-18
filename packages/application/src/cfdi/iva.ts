/**
 * IVA arithmetic in integer centavos (CLAUDE.md §2.8 — never floats).
 *
 * Plan prices are IVA-included (consumer prices must be), so the charged total
 * is authoritative and the base is derived from it:
 *
 *   subtotal = round_half_up(total × 100 / 116)
 *   iva      = total − subtotal
 *
 * so subtotal + iva always equals what the customer paid. This is exactly the
 * comprobante-level rounding a PAC produces when the concepto carries the base
 * with 6 decimals (e.g. 399.00 → 343.965517 → SubTotal 343.97, IVA 55.03).
 * A tie (exactly .5 centavo) cannot occur: it would need 50·T = 58·k + 29.
 */

import type { Money } from '@xangarro/domain';
import { CfdiError } from './errors.js';
import { IVA_RATE } from './sat-catalogs.js';

export interface IvaSplit {
  /** Base before IVA, in centavos. */
  readonly subtotal: Money;
  /** IVA trasladado 16%, in centavos. */
  readonly iva: Money;
}

/** Integer division rounding half up, for non-negative operands. */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

function assertCentavos(value: unknown, allowZero: boolean): asserts value is bigint {
  const ok = typeof value === 'bigint' && (allowZero ? value >= 0n : value > 0n);
  if (!ok) {
    throw new CfdiError('CFDI_INVALID_AMOUNT', `Monto inválido en centavos: ${String(value)}`);
  }
}

/** Split an IVA-included total (centavos, > 0) into base + IVA. */
export function splitIvaIncluded(total: Money): IvaSplit {
  assertCentavos(total, false);
  const { numerator, denominator } = IVA_RATE;
  const subtotal = divRoundHalfUp(total * denominator, denominator + numerator);
  return { subtotal, iva: total - subtotal };
}

/** IVA 16% on a base (centavos, ≥ 0), rounded half up to the centavo. */
export function ivaOnBase(base: Money): Money {
  assertCentavos(base, true);
  return divRoundHalfUp(base * IVA_RATE.numerator, IVA_RATE.denominator);
}
