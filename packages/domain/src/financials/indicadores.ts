/**
 * Indicadores — KPIs and ratios derived from the NIF statements.
 *
 * Every metric is `number | null`. A zero denominator yields `null` so
 * the UI can render "—" instead of a spurious Infinity or NaN. Margins
 * are expressed as fractions (0.25 = 25%); the UI does the Intl
 * percent formatting.
 *
 * Inputs are the already-computed NIF statements plus a few aggregates
 * the caller pre-computes from the repositories:
 *   - activoCorriente = efectivo + inventarios + cuentasPorCobrar
 *   - pasivoCorriente = pasivo.total (Phase 1 has no separation)
 *   - costoDeVentasPeriodo = estadoResultados.costoDeVentas
 *   - inventarioPromedio = (inventario inicial + inventario final) / 2
 *   - cuentasPorCobrarPeriodo = balance.cuentasPorCobrar
 *   - periodoDiasVenta = días del periodo (p.ej. 30 para un mes)
 *   - ventasCreditoPeriodo = Σ ventas en Crédito del periodo
 */

import type { BalanceGeneral } from './balance-general.js';
import type { EstadoDeResultados } from './estado-resultados.js';
import type { Money } from '../money/index.js';
import { ZERO } from '../money/index.js';

export interface Indicadores {
  margenBruto: number | null;
  margenOperativo: number | null;
  margenNeto: number | null;
  razonDeLiquidez: number | null;
  rotacionInventario: number | null;
  diasPromedioCobranza: number | null;
}

export interface IndicadoresInput {
  estadoResultados: EstadoDeResultados;
  balanceGeneral: BalanceGeneral;
  inventarioPromedio: Money;
  ventasCreditoPeriodoCentavos: Money;
  periodoDiasVenta: number;
}

export function calculateIndicadores(input: IndicadoresInput): Indicadores {
  const { estadoResultados: er, balanceGeneral: bg } = input;

  return {
    margenBruto: ratio(er.utilidadBruta, er.ingresos),
    margenOperativo: ratio(er.utilidadOperativa, er.ingresos),
    margenNeto: ratio(er.utilidadNeta, er.ingresos),
    razonDeLiquidez: ratio(bg.activo.total, bg.pasivo.total),
    rotacionInventario: ratio(er.costoDeVentas, input.inventarioPromedio),
    diasPromedioCobranza: calcDiasCobranza(
      bg.activo.cuentasPorCobrar,
      input.ventasCreditoPeriodoCentavos,
      input.periodoDiasVenta,
    ),
  };
}

/** Money / Money → number | null. Returns null when denominator is 0. */
function ratio(num: Money, den: Money): number | null {
  if (den === ZERO) return null;
  // Convert via Number — both sides are centavos, so the ratio is unitless.
  // Loss of precision is acceptable here (dashboard metric, not money).
  return Number(num) / Number(den);
}

/**
 * Días Promedio de Cobranza = (CxC / ventasCrédito) × días.
 *   - ventasCrédito === 0 → null (no credit sales to measure against).
 *   - CxC === 0 → 0 (everything collected).
 *   - Days defaults to the caller's periodo size, never the calendar year,
 *     to match CLAUDE.md §10 (dates computed outside the function).
 */
function calcDiasCobranza(
  cuentasPorCobrar: Money,
  ventasCreditoPeriodo: Money,
  periodoDias: number,
): number | null {
  if (ventasCreditoPeriodo === ZERO) return null;
  if (cuentasPorCobrar === ZERO) return 0;
  return (Number(cuentasPorCobrar) / Number(ventasCreditoPeriodo)) * periodoDias;
}
