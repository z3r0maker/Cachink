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
  /** Days between the first record (venta o egreso) and hoy; 0 when none. */
  readonly diasDeHistorial: number;
  /** Purchase entries (inventory_movements tipo entrada), ever. */
  readonly compras: number;
  /** Cortes de día, ever. */
  readonly cortes: number;
  /** Months with at least one egreso, ever. */
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
  const inventario = cuenta(rows.diasConVenta, 60, 'días de ventas');
  const gastos = cuenta(rows.mesesConGasto, 3, 'meses con gastos');
  const pronostico = cuenta(rows.diasConVenta, 90, 'días de ventas');
  const cortes = cuenta(rows.cortes, 20, 'cortes');

  const defs: readonly (readonly [string, string, ReturnType<typeof cuenta> | typeof margenes])[] =
    [
      ['Resumen del mes', '1 mes completo de registros', resumen],
      ['Precios y márgenes', '60 días de ventas + 2 compras', margenes],
      ['Inventario', '60 días de ventas', inventario],
      ['Gastos fuera de lo normal', '3 meses con gastos', gastos],
      ['Pronóstico', '90 días de ventas', pronostico],
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

/** Months with at least one egreso — helper for the portal's counts. */
export function mesesConGastoDe(fechas: readonly IsoDate[]): number {
  return new Set(fechas.map((f) => f.slice(0, 7))).size;
}

export { mesAnterior };
