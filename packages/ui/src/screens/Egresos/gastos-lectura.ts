/**
 * Gastos as the phone reads and writes them (MvGastos; the web caja's
 * `runtime/gastos.ts` and `gastos/viva.tsx`): the turno's expenses in the
 * operator's five categories, a due recurring gasto as the sheet's prefill,
 * and a captured gasto as the domain's `NewExpense`, scoped to the turno so
 * the expected cash sees it. Receipt photos wait for the storage bucket
 * (ADR-083 D3), so no row claims one. Pure.
 */
import {
  formatMoney,
  type BusinessId,
  type CajaTurnoId,
  type Expense,
  type IsoDate,
  type NewExpense,
  type RecurringExpense,
} from '@xangarro/domain';
import { categoriaDominio, categoriaOperador, hhmmLocal } from '@xangarro/caja';
import type { GastoTurno, NuevoGasto, PrefillGasto } from '@xangarro/caja/gastos';
import type { RecurrentePara } from '@xangarro/caja/lectura';

export function gastoDeEgreso(e: Expense): GastoTurno {
  return {
    id: e.id,
    concepto: e.concepto,
    detalle: e.proveedor ?? '',
    monto: e.monto,
    categoria: categoriaOperador(e.categoria),
    hora: hhmmLocal(e.createdAt),
    comprobante: false,
  };
}

/**
 * The turno's expenses: the ones scoped to it, plus today's unscoped ones
 * captured since it opened (an inventory purchase writes its egreso without
 * the turno). Newest first, each once.
 */
export function gastosDelTurno(
  delTurno: readonly Expense[],
  deHoy: readonly Expense[],
  turno: { readonly id: string; readonly aperturaAt: string } | null,
): readonly Expense[] {
  const sueltos = deHoy.filter(
    (e) => turno === null || (e.cajaTurnoId === null && e.createdAt >= turno.aperturaAt),
  );
  const todos = new Map<string, Expense>();
  for (const e of [...delTurno, ...sueltos]) todos.set(e.id, e);
  return [...todos.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** A due recurring gasto, as the sheet opens filled with it. */
export function prefillDe(r: RecurringExpense): PrefillGasto {
  return {
    recurrenteId: r.id,
    concepto: r.concepto,
    monto: r.montoCentavos,
    categoria: categoriaOperador(r.categoria),
    proveedor: r.proveedor,
  };
}

export function egresoDe(
  n: NuevoGasto,
  ctx: {
    readonly businessId: BusinessId;
    readonly fecha: IsoDate;
    readonly turnoId: string | null;
  },
): NewExpense {
  return {
    fecha: ctx.fecha,
    concepto: n.concepto,
    categoria: categoriaDominio(n.categoria),
    monto: n.monto,
    ...(n.proveedor === null ? {} : { proveedor: n.proveedor }),
    ...(ctx.turnoId === null ? {} : { cajaTurnoId: ctx.turnoId as CajaTurnoId }),
    businessId: ctx.businessId,
  };
}

/** «−$450.00 · Gas · Servicios.»: the toast after saving. */
export const avisoGasto = (n: NuevoGasto): string =>
  `−${formatMoney(n.monto)} · ${n.concepto} · ${n.categoria}.`;

/** Days from `hoy` to `fecha` (ISO dates); negative when it is past. */
export function diasHasta(hoy: string, fecha: string): number {
  const ms = Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** The template as Mi turno's «Pendientes de registrar» reads it (`comoPendiente`). */
export function recurrenteParaDe(r: RecurringExpense, hoy: string): RecurrentePara {
  return {
    id: r.id,
    concepto: r.concepto,
    frecuencia: r.frecuencia,
    diaDelMes: r.diaDelMes,
    proveedor: r.proveedor,
    montoCentavos: r.montoCentavos.toString(),
    vence: diasHasta(hoy, r.proximoDisparo),
  };
}

/** «Vence hoy», «Atrasado 2 días» (the web's Pendientes row chip; due ones only reach here). */
export function venceTexto(vence: number): string {
  if (vence >= 0) return 'Vence hoy';
  const dias = -vence;
  return `Atrasado ${dias} ${dias === 1 ? 'día' : 'días'}`;
}
