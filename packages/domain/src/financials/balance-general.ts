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
import { estadoDeCuenta, type CargoFiado, type PagoCliente } from './estado-cuenta.js';
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

/**
 * Day-one facts (N-17, C-20). Additive by design: the caller composes them
 * with the period's own facts and is responsible for not counting the same
 * peso twice — today the portal passes no cortes, so the opening cash is the
 * whole cash line; the day cortes feed this calculator too, the caller passes
 * the opening plus the period's cash movement, not the drawer totals again.
 */
export interface AperturaBalances {
  /** Caja + bancos at fecha de apertura. */
  readonly efectivoInicial: Money;
  /** One saldo per cliente (≥ 0); feeds `estadoDeCuenta` as its third fact. */
  readonly cuentasPorCobrar: readonly { clienteId: string; saldoCentavos: Money }[];
  /**
   * The owner's day-one equity: what the imported assets sum to (efectivo +
   * CxC + the opening inventory valuation), caller-computed so the identity
   * Activo = Pasivo + Capital holds from statement one.
   */
  readonly capitalInicial: Money;
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
  /** Day-one facts; omitted by callers without opening balances. */
  readonly apertura?: AperturaBalances;
}

export function calculateBalanceGeneral(input: BalanceGeneralInput): BalanceGeneral {
  const apertura = input.apertura;
  const efectivo = latestCorteCash(input.cortesDelDia) + (apertura?.efectivoInicial ?? ZERO);
  const inventarios = sum(
    input.inventarioStock.map((s) => s.costoUnitCentavos * BigInt(s.cantidad)),
  );
  const cuentasPorCobrar = calcCuentasPorCobrar(
    input.ventasConCredito,
    input.pagosClientes,
    apertura?.cuentasPorCobrar ?? [],
  );

  const activoTotal = efectivo + inventarios + cuentasPorCobrar;
  const capitalTotal = input.utilidadDelPeriodo + (apertura?.capitalInicial ?? ZERO);

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
 * Σ of every client's derived balance (ADR-074): per client, the open fiado
 * tickets minus their abonos, oldest-first — `estadoDeCuenta` is the one
 * calculator, so the balance sheet cannot disagree with Cobranza. An excess
 * abono (saldo a favor) is not an asset, so only `saldo` counts.
 */
function calcCuentasPorCobrar(
  ventasConCredito: readonly Sale[],
  pagosClientes: readonly ClientPayment[],
  saldosIniciales: readonly { clienteId: string; saldoCentavos: Money }[],
): Money {
  const ventasPorCliente = new Map<string, CargoFiado[]>();
  for (const venta of ventasConCredito) {
    if (venta.estadoPago !== 'pendiente' && venta.estadoPago !== 'parcial') continue;
    const key = venta.clienteId ?? venta.id; // defensive: fiado without a client
    const bucket = ventasPorCliente.get(key) ?? [];
    bucket.push({ id: venta.id, fecha: venta.createdAt, monto: venta.monto });
    ventasPorCliente.set(key, bucket);
  }
  const abonosPorCliente = new Map<string, PagoCliente[]>();
  for (const p of pagosClientes) {
    const bucket = abonosPorCliente.get(p.clienteId) ?? [];
    bucket.push({ id: p.id, fecha: p.createdAt, monto: p.montoCentavos });
    abonosPorCliente.set(p.clienteId, bucket);
  }
  const aperturaPorCliente = new Map(saldosIniciales.map((s) => [s.clienteId, s.saldoCentavos]));

  // A client can arrive with an opening saldo and no tickets yet (C-20).
  const clientes = new Set([...ventasPorCliente.keys(), ...aperturaPorCliente.keys()]);
  let total: Money = ZERO;
  for (const cliente of clientes) {
    total += estadoDeCuenta(
      ventasPorCliente.get(cliente) ?? [],
      abonosPorCliente.get(cliente) ?? [],
      aperturaPorCliente.get(cliente) ?? ZERO,
    ).saldo;
  }
  return total;
}
