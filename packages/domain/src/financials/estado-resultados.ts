/**
 * Estado de Resultados (NIF B-3).
 *
 * Pure function. Callers pre-filter ventas + egresos by period. We treat
 * every Venta as ingreso regardless of `estadoPago` (accrual basis).
 *
 * Formula:
 *   ingresos         = Σ ventas.monto
 *   costoDeVentas    = Σ egresos with categoria ∈ {Materia Prima, Inventario}
 *   utilidadBruta    = ingresos − costoDeVentas
 *   merma            = Σ(cantidad × costoUnitCentavos) for merma movements  (Phase 7)
 *   gastosOperativos = Σ egresos with other categorias
 *   utilidadOperativa = utilidadBruta − merma − gastosOperativos
 *   isr              = max(0, utilidadOperativa × isrTasa)
 *   utilidadNeta     = utilidadOperativa − isr
 */

import type { Expense } from '../entities/expense.js';

import { calcularIsrPorRegimen } from './isr-regimen.js';
import type { InventoryMovement } from '../entities/inventory-movement.js';
import type { Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { ZERO, sum } from '../money/index.js';

const COSTO_DE_VENTAS_CATS = new Set<Expense['categoria']>(['Materia Prima', 'Inventario']);

/** Whether an egreso category is costo de ventas (else a gasto operativo) — the one rule. */
export const esCostoDeVentas = (categoria: Expense['categoria']): boolean =>
  COSTO_DE_VENTAS_CATS.has(categoria);

export interface EstadoDeResultados {
  ingresos: Money;
  costoDeVentas: Money;
  utilidadBruta: Money;
  /** Phase 7: merma cost = Σ(cantidad × costoUnitCentavos). */
  merma: Money;
  gastosOperativos: Money;
  utilidadOperativa: Money;
  isr: Money;
  utilidadNeta: Money;
}

export interface EstadoDeResultadosInput {
  ventas: readonly Sale[];
  egresos: readonly Expense[];
  /** Inventory movements with motivo 'Merma / daño'. Phase 7. */
  mermaMovements?: readonly InventoryMovement[];
  /** ISR rate in basis points (3000 = 30%). The owner's rate, from Negocio. */
  isrTasa: number;
  /** SAT régime code (ADR-089): 626 estimates on gross, 612 on the Art. 96
   * tariff, anything else (or absent) uses `isrTasa` — the phone passes
   * nothing, so it keeps today's behavior exactly. */
  regimenSat?: string | null;
  /** Months the period spans, for the SAT monthly tables. Default 1. */
  mesesEnPeriodo?: number;
}

export function calculateEstadoDeResultados(input: EstadoDeResultadosInput): EstadoDeResultados {
  const { ventas, egresos, isrTasa } = input;
  if (!Number.isInteger(isrTasa) || isrTasa < 0 || isrTasa > 10_000) {
    throw new TypeError(`isrTasa must be an integer in [0, 10_000], got ${isrTasa}`);
  }

  const ingresos = sum(ventas.map((v) => v.monto));

  const costoDeVentas = sum(
    egresos.filter((e) => esCostoDeVentas(e.categoria)).map((e) => e.monto),
  );
  const gastosOperativos = sum(
    egresos.filter((e) => !esCostoDeVentas(e.categoria)).map((e) => e.monto),
  );

  const merma = calculateMermaTotal(input.mermaMovements ?? []);

  const utilidadBruta = ingresos - costoDeVentas;
  const utilidadOperativa = utilidadBruta - merma - gastosOperativos;

  // A provided régime routes through the SAT tables (ADR-089); without one —
  // the phone's case — the owner's rate on utilidad stands, as always.
  const isr =
    input.regimenSat === undefined
      ? calculateIsr(utilidadOperativa, isrTasa)
      : calcularIsrPorRegimen({
          regimenSat: input.regimenSat,
          ingresos,
          utilidad: utilidadOperativa,
          isrTasa,
          meses: input.mesesEnPeriodo,
        }).isr;
  const utilidadNeta = utilidadOperativa - isr;

  return {
    ingresos,
    costoDeVentas,
    utilidadBruta,
    merma,
    gastosOperativos,
    utilidadOperativa,
    isr,
    utilidadNeta,
  };
}

/** Merma cost = Σ(cantidad × costoUnitCentavos) for merma movements. */
function calculateMermaTotal(movements: readonly InventoryMovement[]): Money {
  return sum(movements.map((m) => BigInt(m.cantidad) * m.costoUnitCentavos));
}

/** ISR computed on positive utilidad only (no tax credits). */
function calculateIsr(utilidadOperativa: Money, isrTasa: number): Money {
  if (utilidadOperativa <= ZERO) return ZERO;
  return (utilidadOperativa * BigInt(isrTasa)) / 10_000n;
}
