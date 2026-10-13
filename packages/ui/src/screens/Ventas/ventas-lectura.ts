/**
 * Reads the turno's Ventas from the phone's repositories (M-08): the
 * operator's open turno and its tickets, each with its lines summed into the
 * row's amount and the fiado client's name; and the ticket the sheet opens,
 * with its priced lines. Rows in, read models out — the shaping itself lives
 * in `@xangarro/caja/ventas` (`ventaTurnoDe`, `ventaDetalleDe`).
 */
import { hhmmLocal } from '@xangarro/caja';
import {
  ventaDetalleDe,
  ventaTurnoDe,
  type VentaDetalle,
  type VentaTurno,
} from '@xangarro/caja/ventas';
import type { TicketId, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';

type R = Pick<Repositories, 'cajaTurnos' | 'tickets' | 'sales' | 'clients'>;

export interface FilasVentas {
  /** Null when the operator has no open turno: the screen's sin-turno state. */
  readonly turnoId: string | null;
  /** "HH:MM", when the turno opened. */
  readonly desde: string | null;
  readonly ventas: readonly VentaTurno[];
}

export async function leerVentasTurno(r: R, userId: UserId): Promise<FilasVentas> {
  const turno = await r.cajaTurnos.findOpenByUser(userId);
  if (turno === null) return { turnoId: null, desde: null, ventas: [] };
  const tickets = await r.tickets.findByCajaTurno(turno.id);
  const ventas = await Promise.all(
    tickets.map(async (t) => {
      const lineas = await r.sales.findByTicket(t.id);
      const cliente =
        t.clienteId === null ? null : ((await r.clients.findById(t.clienteId))?.nombre ?? null);
      return ventaTurnoDe(t, lineas, cliente);
    }),
  );
  return { turnoId: turno.id, desde: hhmmLocal(turno.aperturaAt), ventas };
}

/** The sheet's ticket by its id, or null when it is no longer in the caja. */
export async function leerVentaDetalle(
  r: R,
  ticketId: TicketId,
  ctx: { readonly hoy: string; readonly capturo: string },
): Promise<VentaDetalle | null> {
  const t = await r.tickets.findById(ticketId);
  if (t === null) return null;
  const [lineas, cliente] = await Promise.all([
    r.sales.findByTicket(t.id),
    t.clienteId === null ? Promise.resolve(null) : r.clients.findById(t.clienteId),
  ]);
  return ventaDetalleDe(t, lineas, {
    hoy: ctx.hoy,
    capturo: ctx.capturo,
    ...(cliente === null ? {} : { cliente: { nombre: cliente.nombre } }),
  });
}
