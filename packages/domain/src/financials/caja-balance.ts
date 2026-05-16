/**
 * computeCajaBalance — pure function that computes the live cash balance
 * for an open caja turn.
 *
 * This is the single source of truth for how much cash should be in the
 * drawer at any point during a turn. Used by both the enhanced Caja screen
 * (live display) and CerrarCajaUseCase (expected amount at close).
 *
 * Formula:
 *   efectivoEnCaja =
 *       apertura
 *     + adicional
 *     + Σ ventas efectivo (monto)
 *     - Σ cambios dados (efectivoRecibido − monto, for cash sales)
 *     - Σ egresos efectivo
 *     + Σ depósitos manuales
 *     - Σ retiros manuales
 *     - Σ cancelaciones efectivo (cash returned)
 */

import { type Money, ZERO, sum } from '../money/index.js';

export interface CajaBalanceInput {
  /** Opening amount in centavos. */
  readonly aperturaCentavos: Money;
  /** Additional cash added at opening. */
  readonly adicionalCentavos: Money;
  /** All cash sales during the turn (monto values). */
  readonly ventasEfectivoCentavos: readonly Money[];
  /** Cash received values for sales where efectivoRecibido > monto. */
  readonly efectivoRecibidoPorVenta: readonly {
    readonly monto: Money;
    readonly efectivoRecibido: Money;
  }[];
  /** All cash expense amounts during the turn. */
  readonly egresosEfectivoCentavos: readonly Money[];
  /** Manual deposit amounts. */
  readonly depositosCentavos: readonly Money[];
  /** Manual withdrawal amounts. */
  readonly retirosCentavos: readonly Money[];
  /** Cash returned for cancelled cash sales. */
  readonly cancelacionesEfectivoCentavos: readonly Money[];
}

export interface CajaBalanceResult {
  /** Net cash that should be in the drawer. */
  readonly efectivoEnCaja: Money;
  /** Breakdown for the UI card. */
  readonly desglose: {
    readonly apertura: Money;
    readonly adicional: Money;
    readonly ventasEfectivo: Money;
    readonly cambiosDados: Money;
    readonly egresosEfectivo: Money;
    readonly depositos: Money;
    readonly retiros: Money;
    readonly cancelacionesEfectivo: Money;
  };
}

export function computeCajaBalance(
  input: CajaBalanceInput,
): CajaBalanceResult {
  const ventasEfectivo = sum(input.ventasEfectivoCentavos);
  const cambiosDados = computeCambiosDados(input.efectivoRecibidoPorVenta);
  const egresosEfectivo = sum(input.egresosEfectivoCentavos);
  const depositos = sum(input.depositosCentavos);
  const retiros = sum(input.retirosCentavos);
  const cancelaciones = sum(input.cancelacionesEfectivoCentavos);

  const efectivoEnCaja =
    input.aperturaCentavos +
    input.adicionalCentavos +
    ventasEfectivo -
    cambiosDados -
    egresosEfectivo +
    depositos -
    retiros -
    cancelaciones;

  return {
    efectivoEnCaja,
    desglose: {
      apertura: input.aperturaCentavos,
      adicional: input.adicionalCentavos,
      ventasEfectivo,
      cambiosDados,
      egresosEfectivo,
      depositos,
      retiros,
      cancelacionesEfectivo: cancelaciones,
    },
  };
}

/** Sum of (efectivoRecibido − monto) for sales where customer overpaid. */
function computeCambiosDados(
  ventas: readonly { monto: Money; efectivoRecibido: Money }[],
): Money {
  let total: Money = ZERO;
  for (const v of ventas) {
    const cambio = v.efectivoRecibido - v.monto;
    if (cambio > ZERO) total += cambio;
  }
  return total;
}
