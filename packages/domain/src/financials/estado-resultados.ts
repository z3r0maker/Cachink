/**
 * Estado de Resultados (NIF B-3).
 *
 * Pure function. Callers pre-filter ventas + egresos by period. We treat
 * every Venta as ingreso regardless of `estadoPago` (accrual basis) —
 * Crédito ventas do count as ingresos here even though they don't move
 * cash. Flujo de Efectivo is the right place to reconcile cash.
 *
 * Formula (CLAUDE.md §10):
 *   ingresos        = Σ ventas.monto
 *   costoDeVentas   = Σ egresos with categoria ∈ {Materia Prima, Inventario}
 *   utilidadBruta   = ingresos − costoDeVentas
 *   gastosOperativos = Σ egresos with other categorias
 *   utilidadOperativa = utilidadBruta − gastosOperativos
 *   isr             = max(0, utilidadOperativa × isrTasa)   ← clamped
 *   utilidadNeta    = utilidadOperativa − isr
 *
 * ISR-on-losses note: CLAUDE.md §10 is silent on negative income tax.
 * We clamp ISR ≥ 0 — a loss period doesn't generate a tax credit in the
 * P&L. If accountant review disagrees, supersede via ADR without changing
 * the public signature.
 */

import type { Expense } from '../entities/expense.js';
import type { Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { ZERO, sum } from '../money/index.js';

const COSTO_DE_VENTAS_CATS = new Set<Expense['categoria']>(['Materia Prima', 'Inventario']);

export interface EstadoDeResultados {
  ingresos: Money;
  costoDeVentas: Money;
  utilidadBruta: Money;
  gastosOperativos: Money;
  utilidadOperativa: Money;
  isr: Money;
  utilidadNeta: Money;
}

export interface EstadoDeResultadosInput {
  ventas: readonly Sale[];
  egresos: readonly Expense[];
  /** Effective ISR rate as a fraction, e.g. 0.30 for 30%. */
  isrTasa: number;
}

export function calculateEstadoDeResultados(
  input: EstadoDeResultadosInput,
): EstadoDeResultados {
  const { ventas, egresos, isrTasa } = input;
  if (!Number.isFinite(isrTasa) || isrTasa < 0 || isrTasa > 1) {
    throw new TypeError(`isrTasa must be a finite number in [0, 1], got ${isrTasa}`);
  }

  const ingresos = sum(ventas.map((v) => v.monto));

  const costoDeVentas = sum(
    egresos.filter((e) => COSTO_DE_VENTAS_CATS.has(e.categoria)).map((e) => e.monto),
  );
  const gastosOperativos = sum(
    egresos.filter((e) => !COSTO_DE_VENTAS_CATS.has(e.categoria)).map((e) => e.monto),
  );

  const utilidadBruta = ingresos - costoDeVentas;
  const utilidadOperativa = utilidadBruta - gastosOperativos;

  const isr = calculateIsr(utilidadOperativa, isrTasa);
  const utilidadNeta = utilidadOperativa - isr;

  return {
    ingresos,
    costoDeVentas,
    utilidadBruta,
    gastosOperativos,
    utilidadOperativa,
    isr,
    utilidadNeta,
  };
}

/**
 * ISR is computed on positive utilidad only. Multiplying a bigint by
 * `isrTasa × 10000` + integer-divide by 10000n keeps the arithmetic
 * in bigint land — no floats touch money.
 */
function calculateIsr(utilidadOperativa: Money, isrTasa: number): Money {
  if (utilidadOperativa <= ZERO) return ZERO;
  const basisPoints = BigInt(Math.round(isrTasa * 10_000));
  return (utilidadOperativa * basisPoints) / 10_000n;
}
