/**
 * The rows a turno's money comes from, read the way `CerrarCajaUseCase`
 * reads them: tickets, their lines, gastos and abonos from the turno's day to
 * today. Scoping to the turno happens after, in `partesDelTurno` (the O-03
 * rule: `cajaTurnoId` decides for tickets and gastos; an abono has no turno,
 * so every abono of those days counts, as it does when the close is stored).
 * Inicio, Mi turno and Cierre read through here, so the three agree.
 */
import type { BusinessId, ClientPayment, Expense, IsoDate, Sale, Ticket } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';

export interface FilasDelTurno {
  readonly tickets: readonly Ticket[];
  readonly lineas: readonly Sale[];
  readonly gastos: readonly Expense[];
  readonly abonos: readonly ClientPayment[];
}

export type RepoFilas = Pick<Repositories, 'tickets' | 'sales' | 'expenses' | 'clientPayments'>;

/** From the turno's day to today; a turno dated after today (a clock moved back) reads its own day. */
export async function leerFilasDelTurno(
  r: RepoFilas,
  fecha: string,
  hoy: string,
  businessId: BusinessId,
): Promise<FilasDelTurno> {
  const desde = fecha as IsoDate;
  const hasta = (hoy > fecha ? hoy : fecha) as IsoDate;
  const [tickets, lineas, gastos, abonos] = await Promise.all([
    r.tickets.findByDateRange(desde, hasta, businessId),
    r.sales.findByDateRange(desde, hasta, businessId),
    r.expenses.findByDateRange(desde, hasta, businessId),
    r.clientPayments.findByDateRange(desde, hasta, businessId),
  ]);
  return { tickets, lineas, gastos, abonos };
}

export const SIN_FILAS: FilasDelTurno = { tickets: [], lineas: [], gastos: [], abonos: [] };
