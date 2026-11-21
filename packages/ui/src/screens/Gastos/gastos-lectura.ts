/**
 * Reads the rows the Gastos screen says from the phone's repositories
 * (Track M, M-08): the operator's open turno (or the newest one on the
 * device, as Inicio reads it), that day's expenses as the board's rows
 * (`gastosDelTurno`) and the recurring gastos already due, each beside the
 * prefill its sheet opens with, and which gastos have their receipt photo
 * (M-18). The owner's first name rides along for the «Sin comprobante» note. Pure over the repositories' rows.
 */
import {
  gastosDelTurno,
  prefillDe,
  type GastoTurno,
  type RecurrentePorPagar,
} from '@xangarro/caja/gastos';
import type { BusinessId, CajaTurno, IsoDate, RecurringExpense } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';
import { comoRecurrente } from '../Inicio/inicio-filas';

type R = Pick<Repositories, 'cajaTurnos' | 'expenses' | 'expenseReceipts' | 'recurringExpenses'>;

/** Each due recurring gasto: the row the list shows, and what its sheet opens with. */
export const recurrentesPorPagar = (
  filas: readonly RecurringExpense[],
  hoy: string,
): readonly RecurrentePorPagar[] =>
  filas.map((r) => ({ para: comoRecurrente(r, hoy), prefill: prefillDe(r) }));

export interface FilasGastos {
  /** The open turno, whose id stamps a new gasto; null outside a turno. */
  readonly abierto: CajaTurno | null;
  /** The turno whose gastos the list says: the open one, or the newest. */
  readonly turno: CajaTurno | null;
  readonly gastos: readonly GastoTurno[];
  readonly recurrentes: readonly RecurrentePorPagar[];
}

export async function leerFilasGastos(
  r: R,
  businessId: BusinessId,
  hoy: string,
): Promise<FilasGastos> {
  const abierto = await r.cajaTurnos.findOpenByBusiness(businessId);
  const turno = abierto ?? (await r.cajaTurnos.findLatest(businessId));
  const fecha = turno?.fecha ?? hoy;
  const [expenses, recurrentes] = await Promise.all([
    r.expenses.findByDateRange(fecha, fecha, businessId),
    r.recurringExpenses.findDue(hoy as IsoDate, businessId),
  ]);
  // Which of the day's gastos carry their ticket's photo (M-18, ADR-149).
  const conFoto = await r.expenseReceipts.findGastosWithReceipt(expenses.map((g) => g.id));
  return {
    abierto,
    turno,
    gastos: gastosDelTurno(expenses, turno?.id ?? null, conFoto),
    recurrentes: recurrentesPorPagar(recurrentes, hoy),
  };
}
