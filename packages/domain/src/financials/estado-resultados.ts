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
import type { InventoryMovement } from '../entities/inventory-movement.js';
import type { Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { ZERO, sum } from '../money/index.js';

const COSTO_DE_VENTAS_CATS = new Set<Expense['categoria']>([
  'Materia Prima',
  'Inventario',
]);

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
  /** Effective ISR rate as a fraction, e.g. 0.30 for 30%. */
  isrTasa: number;
}

export function calculateEstadoDeResultados(
  input: EstadoDeResultadosInput,
): EstadoDeResultados {
  const { ventas, egresos, isrTasa } = input;
  if (!Number.isFinite(isrTasa) || isrTasa < 0 || isrTasa > 1) {
    throw new TypeError(
      `isrTasa must be in [0, 1], got ${isrTasa}`,
    );
  }

  const ingresos = sum(ventas.map((v) => v.monto));

  const costoDeVentas = sum(
    egresos
      .filter((e) => COSTO_DE_VENTAS_CATS.has(e.categoria))
      .map((e) => e.monto),
  );
  const gastosOperativos = sum(
    egresos
      .filter((e) => !COSTO_DE_VENTAS_CATS.has(e.categoria))
      .map((e) => e.monto),
  );

  const merma = calculateMermaTotal(input.mermaMovements ?? []);

  const utilidadBruta = ingresos - costoDeVentas;
  const utilidadOperativa =
    utilidadBruta - merma - gastosOperativos;

  const isr = calculateIsr(utilidadOperativa, isrTasa);
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
function calculateMermaTotal(
  movements: readonly InventoryMovement[],
): Money {
  return sum(
    movements.map(
      (m) => BigInt(m.cantidad) * m.costoUnitCentavos,
    ),
  );
}

/** ISR computed on positive utilidad only (no tax credits). */
function calculateIsr(
  utilidadOperativa: Money,
  isrTasa: number,
): Money {
  if (utilidadOperativa <= ZERO) return ZERO;
  const basisPoints = BigInt(Math.round(isrTasa * 10_000));
  return (utilidadOperativa * basisPoints) / 10_000n;
}
