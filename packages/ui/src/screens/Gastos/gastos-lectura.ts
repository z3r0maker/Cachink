/**
 * Reads the rows the Gastos screen says from the phone's repositories
 * (Track M, M-08): the operator's open turno (or the newest one on the
 * device, as Inicio reads it), that day's expenses as the board's rows
 * (`gastosDelTurno`) and the recurring gastos already due, each beside the
 * prefill its sheet opens with. The owner's first name rides along for the
 * «Sin comprobante» note. Pure over the repositories' rows.
 */
import { nombreDueno } from '@xangarro/caja';
import {
  gastosDelTurno,
  prefillDe,
  type GastoTurno,
  type RecurrentePorPagar,
} from '@xangarro/caja/gastos';
import type { BusinessId, CajaTurno, IsoDate, RecurringExpense, UserId } from '@xangarro/domain';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { Repositories } from '../../app/repository-provider';
import { comoRecurrente } from '../Inicio/inicio-filas';

type R = Pick<Repositories, 'appConfig' | 'cajaTurnos' | 'expenses' | 'recurringExpenses'>;

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
  /** The owner's first name, or «el dueño» until the device knows it. */
  readonly dueno: string;
}

export async function leerFilasGastos(
  r: R,
  businessId: BusinessId,
  userId: UserId,
  hoy: string,
): Promise<FilasGastos> {
  const abierto = await r.cajaTurnos.findOpenByUser(userId);
  const turno = abierto ?? (await r.cajaTurnos.findLatest(businessId));
  const fecha = turno?.fecha ?? hoy;
  const [expenses, recurrentes, dueno] = await Promise.all([
    r.expenses.findByDateRange(fecha, fecha, businessId),
    r.recurringExpenses.findDue(hoy as IsoDate, businessId),
    r.appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  ]);
  return {
    abierto,
    turno,
    gastos: gastosDelTurno(expenses, turno?.id ?? null),
    recurrentes: recurrentesPorPagar(recurrentes, hoy),
    dueno: nombreDueno(dueno),
  };
}
