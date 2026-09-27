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
  /**
   * The actionable line beside the count — the design's `lockedCopy`. Empty
   * once the capability is active, so nothing stale can render (ADR-116).
   */
  readonly lockedCopy: string;
}

interface Avance {
  readonly progress: string;
  readonly pct: number;
  readonly lockedCopy: string;
}

function cuenta(
  actual: number,
  objetivo: number,
  unidad: string,
): { progress: string; pct: number } {
  const pct = Math.min(100, Math.round((actual / objetivo) * 100));
  return { progress: `${Math.min(actual, objetivo)} de ${objetivo} ${unidad}`, pct };
}

const enDias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

/** «Llevas 8 de 20 cortes» — the count restated as the thing still to do. */
const llevas = (actual: number, objetivo: number, unidad: string) =>
  `Llevas ${Math.min(actual, objetivo)} de ${objetivo} ${unidad}`;

/**
 * A counter the calendar advances on its own, so «Disponible en N días» is a
 * promise we can keep. Only `diasDeHistorial` qualifies: it is days since the
 * first record and grows whether or not anything else is ever captured.
 */
function porCalendario(actual: number, objetivo: number, unidad: string): Avance {
  return {
    ...cuenta(actual, objetivo, unidad),
    lockedCopy: `Disponible en ${enDias(Math.max(0, objetivo - actual))}`,
  };
}

/**
 * A counter that only moves when the shopkeeper records something, so no date
 * can be promised. The design gives «Disponible en 31 días» for «Gastos fuera
 * de lo normal» — one month, naively 31 days — and a month with no egreso in
 * that category breaks it (ADR-116).
 */
function porRegistro(actual: number, objetivo: number, unidad: string): Avance {
  return { ...cuenta(actual, objetivo, unidad), lockedCopy: llevas(actual, objetivo, unidad) };
}

export function calcularCapacidades(rows: CapacidadRows): readonly Capacidad[] {
  const resumen = porCalendario(rows.diasDeHistorial, 30, 'días de registros');
  const margenes: Avance = {
    progress: `${Math.min(rows.diasConVenta, 60)} de 60 días · ${Math.min(rows.compras, 2)} de 2 compras`,
    pct: Math.min(Math.round((rows.diasConVenta / 60) * 100), Math.round((rows.compras / 2) * 100)),
    // Two blockers, so the line names the one still standing. Repeating «registra
    // el costo» after the compras have landed is advice already taken.
    lockedCopy:
      rows.compras < 2
        ? 'Registra el costo de tus productos para activarlo'
        : llevas(rows.diasConVenta, 60, 'días de ventas'),
  };
  const inventario = porRegistro(rows.diasConMovimiento, 60, 'días de movimientos');
  const gastos = porRegistro(rows.mesesConGasto, 3, 'meses');
  // «90 días de registros» is history since the first record, not days that
  // happen to carry a venta — a business closed on Sundays still accrues them.
  const pronostico = porCalendario(rows.diasDeHistorial, 90, 'días de registros');
  const cortes = porRegistro(rows.cortes, 20, 'cortes');

  const defs: readonly (readonly [string, string, Avance])[] = [
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
    lockedCopy: p.pct < 100 ? p.lockedCopy : '',
  }));
}

export { mesAnterior };
