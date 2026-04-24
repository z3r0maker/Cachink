/**
 * Balance General (NIF B-6).
 *
 * Simplified per CLAUDE.md §10:
 *   Activo  = efectivo + inventarios + cuentasPorCobrar
 *   Pasivo  = pasivosManuales (Phase 1 has no invoice scanning)
 *   Capital = utilidadDelPeriodo
 *
 *   Activo total ≈ Pasivo total + Capital total, within 1-centavo
 *   rounding from the caller's inputs. The caller is responsible for
 *   passing utilidadDelPeriodo (computed via calculateEstadoDeResultados).
 *
 * The `efectivo` line is derived from the sum of DayClose.efectivoContado
 * across all cortes in the period — each corte is the closing cash
 * balance at end of day, and summing them over a period gives the
 * effective change. We keep the calc pure by letting the caller pass
 * the DayClose list; it chooses which cortes to include.
 */

import type { ClientPayment } from '../entities/client-payment.js';
import type { DayClose } from '../entities/day-close.js';
import type { Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { ZERO, sum } from '../money/index.js';

export interface BalanceGeneral {
  activo: {
    efectivo: Money;
    inventarios: Money;
    cuentasPorCobrar: Money;
    total: Money;
  };
  pasivo: { total: Money };
  capital: { utilidadDelPeriodo: Money; total: Money };
}

export interface BalanceGeneralInput {
  /**
   * Nightly cortes to aggregate. We use the **latest** corte per (date,
   * device) pair as the active cash position; the caller pre-filters.
   */
  cortesDelDia: readonly DayClose[];
  /** Current stock per productoId × costoUnit gives the inventory valuation. */
  inventarioStock: readonly { costoUnitCentavos: Money; cantidad: number }[];
  /** Ventas still in pendiente/parcial status. */
  ventasConCredito: readonly Sale[];
  /** All pagos received against any venta in `ventasConCredito`. */
  pagosClientes: readonly ClientPayment[];
  /** Manually tracked liabilities (vendors, loans). Zero when none. */
  pasivosManuales: Money;
  /** Utilidad del periodo from calculateEstadoDeResultados. */
  utilidadDelPeriodo: Money;
}

export function calculateBalanceGeneral(input: BalanceGeneralInput): BalanceGeneral {
  const efectivo = latestCorteCash(input.cortesDelDia);
  const inventarios = sum(
    input.inventarioStock.map((s) => s.costoUnitCentavos * BigInt(s.cantidad)),
  );
  const cuentasPorCobrar = calcCuentasPorCobrar(input.ventasConCredito, input.pagosClientes);

  const activoTotal = efectivo + inventarios + cuentasPorCobrar;
  const capitalTotal = input.utilidadDelPeriodo;

  return {
    activo: {
      efectivo,
      inventarios,
      cuentasPorCobrar,
      total: activoTotal,
    },
    pasivo: { total: input.pasivosManuales },
    capital: {
      utilidadDelPeriodo: input.utilidadDelPeriodo,
      total: capitalTotal,
    },
  };
}

/**
 * Efectivo = sum of `efectivoContado` across the latest corte per
 * (fecha, deviceId). If a day has no corte, we skip it — the cash for
 * that day isn't reconciled and shouldn't be trusted.
 */
function latestCorteCash(cortes: readonly DayClose[]): Money {
  if (cortes.length === 0) return ZERO;
  const latestPerKey = new Map<string, DayClose>();
  for (const c of cortes) {
    const key = `${c.fecha}|${c.deviceId}`;
    const existing = latestPerKey.get(key);
    if (!existing || c.createdAt.localeCompare(existing.createdAt) > 0) {
      latestPerKey.set(key, c);
    }
  }
  return sum([...latestPerKey.values()].map((c) => c.efectivoContadoCentavos));
}

/**
 * Σ(venta.monto − pagos.monto) per pending/parcial venta, clamped ≥ 0
 * per venta (overpayment doesn't become negative CxC).
 */
function calcCuentasPorCobrar(
  ventasConCredito: readonly Sale[],
  pagosClientes: readonly ClientPayment[],
): Money {
  const pagosPorVenta = new Map<string, Money>();
  for (const p of pagosClientes) {
    pagosPorVenta.set(p.ventaId, (pagosPorVenta.get(p.ventaId) ?? ZERO) + p.montoCentavos);
  }

  let total: Money = ZERO;
  for (const venta of ventasConCredito) {
    if (venta.estadoPago !== 'pendiente' && venta.estadoPago !== 'parcial') continue;
    const pagado = pagosPorVenta.get(venta.id) ?? ZERO;
    const pendiente = venta.monto - pagado;
    if (pendiente > ZERO) total += pendiente;
  }
  return total;
}
