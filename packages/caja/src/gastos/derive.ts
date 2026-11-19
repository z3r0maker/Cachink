import { sum, type Expense, type Money, type RecurringExpense } from '@xangarro/domain';

import { hhmmLocal } from '../comun/fechas';
import { matches } from '../comun/search';
import { categoriaOperador } from '../vocabulario';
import type { CategoriaGasto, GastoTurno, PrefillGasto } from './types';

export interface ResumenGastos {
  readonly cuantos: number;
  readonly total: Money;
  readonly sinComprobante: number;
}

/** The three KPIs: how many, how much left the drawer, how many lack a receipt. */
export function resumen(gastos: readonly GastoTurno[]): ResumenGastos {
  return {
    cuantos: gastos.length,
    total: sum(gastos.map((g) => g.monto)),
    sinComprobante: gastos.filter((g) => !g.comprobante).length,
  };
}

/** Category chip, then an accent-insensitive search over concept and supplier. */
export function filtrar(
  gastos: readonly GastoTurno[],
  categoria: 'Todos' | CategoriaGasto,
  query: string,
): readonly GastoTurno[] {
  return gastos
    .filter((g) => categoria === 'Todos' || g.categoria === categoria)
    .filter((g) => matches(query, `${g.concepto} ${g.detalle}`));
}

/** 65000n → «650.00», what the amount field holds when the drawer opens filled. */
export const montoCrudo = (m: bigint): string => `${m / 100n}.${String(m % 100n).padStart(2, '0')}`;

/**
 * The phone's Expense rows as the board's list (M-08): the turno's own
 * expenses — the rows its corte subtracts (`esperadoDelTurno`), so the list,
 * Mi turno's Gastos and the esperado agree — newest first. An unstamped row
 * (an entrada's «Compra inventario», a gasto with no turno open) left no
 * drawer and stays out, as on the web caja. `conFoto` holds the ids whose
 * receipt photo the phone has (ADR-149); who was paid is the detail, else
 * whether the ticket's photo is there.
 */
export function gastosDelTurno(
  gastos: readonly Expense[],
  turnoId: string | null,
  conFoto: ReadonlySet<string> = new Set(),
): readonly GastoTurno[] {
  if (turnoId === null) return [];
  return gastos
    .filter((g) => g.deletedAt === null && g.cajaTurnoId === turnoId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((g) => ({
      id: g.id,
      concepto: g.concepto,
      detalle: g.proveedor ?? (conFoto.has(g.id) ? 'Con foto' : 'Sin comprobante'),
      monto: g.monto,
      categoria: categoriaOperador(g.categoria),
      hora: hhmmLocal(g.createdAt),
      comprobante: conFoto.has(g.id),
    }));
}

/**
 * A due recurring gasto as its sheet opens filled (pagar-recurrente): the
 * template's own words and amount, its stored category said the operator's
 * way (`categoriaOperador`), so what the operator picked is what returns.
 */
export function prefillDe(r: RecurringExpense): PrefillGasto {
  return {
    recurrenteId: r.id,
    concepto: r.concepto,
    monto: r.montoCentavos,
    categoria: categoriaOperador(r.categoria),
    proveedor: r.proveedor,
  };
}

/** The due recurring gasto's state chip: «Vence hoy», «Atrasado 3 días». */
export function chipVence(vence: number): string {
  if (vence >= 0) return 'Vence hoy';
  const dias = -vence;
  return `Atrasado ${dias} ${dias === 1 ? 'día' : 'días'}`;
}
