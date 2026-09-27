/**
 * The Asesor's capacidades panel (P-26): progress toward the data volume each
 * capability needs — «33 de 60 días», «8 de 20 cortes» — never invented
 * conclusions. That is the Fase 6 compuerta: a locked capability states how
 * far along its data is, and nothing more.
 */

import type { IsoDate } from '../dates/index.js';
import { mesAnterior } from './insights.js';

/** The counts the thresholds read, computed by the portal in the same pass. */
export interface CapacidadRows {
  readonly hoy: IsoDate;
  /** Days with at least one venta, ever. */
  readonly diasConVenta: number;
  /** Days with at least one inventory movement, ever. */
  readonly diasConMovimiento: number;
  /** Days between the first record (venta o egreso) and hoy; 0 when none. */
  readonly diasDeHistorial: number;
  /**
   * Purchase entries of the **best-stocked single product**, ever — not every
   * entrada in the tenant. `costosQueSubieron` compares a product against its
   * own previous entrada, so two purchases spread over two products predict
   * nothing (ADR-115).
   */
  readonly compras: number;
  /** Cortes de día, ever. */
  readonly cortes: number;
  /**
   * Prior months of the **best-established single category** — not months in
   * which any egreso exists, and never counting the current month.
   * `gastosFueraDeLoNormal` averages one category's previous months (ADR-115).
   */
  readonly mesesConGasto: number;
}

export interface Capacidad {
  readonly name: string;
  readonly requirement: string;
  readonly locked: boolean;
  /** Progress toward the data volume the capability needs. */
  readonly progress: string;
  readonly pct: number;
}

function cuenta(
  actual: number,
  objetivo: number,
  unidad: string,
): { progress: string; pct: number } {
  const pct = Math.min(100, Math.round((actual / objetivo) * 100));
  return { progress: `${Math.min(actual, objetivo)} de ${objetivo} ${unidad}`, pct };
}

export function calcularCapacidades(rows: CapacidadRows): readonly Capacidad[] {
  const resumen = cuenta(rows.diasDeHistorial, 30, 'días de registros');
  const margenes = {
    progress: `${Math.min(rows.diasConVenta, 60)} de 60 días · ${Math.min(rows.compras, 2)} de 2 compras`,
    pct: Math.min(Math.round((rows.diasConVenta / 60) * 100), Math.round((rows.compras / 2) * 100)),
  };
  const inventario = cuenta(rows.diasConMovimiento, 60, 'días de movimientos');
  const gastos = cuenta(rows.mesesConGasto, 3, 'meses');
  // «90 días de registros» is history since the first record, not days that
  // happen to carry a venta — a business closed on Sundays still accrues them.
  const pronostico = cuenta(rows.diasDeHistorial, 90, 'días de registros');
  const cortes = cuenta(rows.cortes, 20, 'cortes');

  const defs: readonly (readonly [string, string, ReturnType<typeof cuenta> | typeof margenes])[] =
    [
      ['Resumen del mes', '1 mes completo de registros', resumen],
      ['Precios y márgenes', '60 días de ventas + 2 compras del producto', margenes],
      ['Inventario', '60 días de movimientos', inventario],
      ['Gastos fuera de lo normal', '3 meses por categoría', gastos],
      ['¿Me alcanza? (pronóstico)', '90 días de registros', pronostico],
      ['Corte de caja', '20 cortes de día', cortes],
    ];
  return defs.map(([name, requirement, p]) => ({
    name,
    requirement,
    locked: p.pct < 100,
    progress: p.pct < 100 ? p.progress : 'Activo',
    pct: p.pct,
  }));
}

export { mesAnterior };
