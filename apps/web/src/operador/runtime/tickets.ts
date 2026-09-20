/**
 * The register's ticket operations (O-06 capture, O-32 Ventas): register a
 * sale, list the open turno's tickets, cancel one — the same use cases the
 * phone runs, over the same Drizzle repositories in the Worker's database.
 */

import {
  DrizzleCajaTurnosRepository,
  DrizzleCancelacionLogsRepository,
  DrizzleClientsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleProductsRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
  DrizzleUsersRepository,
} from '@xangarro/data';
import { CancelarTicketUseCase, RegistrarTicketUseCase } from '@xangarro/application';
import type { RegistrarTicketInput } from '@xangarro/application';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';

import type { Db } from './db-types';
import type { RegistrarContext, VentaPara } from './protocol';

/** Record a sale exactly as the phone does — the atomic use case (ADR-073). */
export async function registrarTicket(
  db: Db,
  input: RegistrarTicketInput,
  ctx: RegistrarContext,
): Promise<{ folio: number }> {
  const useCase = new RegistrarTicketUseCase(
    new DrizzleTicketsRepository(db as never, ctx.deviceId as never, (ctx.userId as never) ?? null),
    new DrizzleSalesRepository(db as never, ctx.deviceId as never, (ctx.userId as never) ?? null),
    new DrizzleClientsRepository(db as never, ctx.deviceId as never),
    new DrizzleProductsRepository(db as never, ctx.deviceId as never),
    new DrizzleInventoryMovementsRepository(db as never, ctx.deviceId as never),
    new DrizzleCajaTurnosRepository(db as never, ctx.deviceId as never),
    { stockEnabled: ctx.stockEnabled, userId: (ctx.userId as never) ?? null },
  );
  const result = await useCase.execute(input);
  return { folio: result.ticket.folio };
}

/** The turno's tickets as Operador · Ventas lists them, and since when (O-32). */
export async function ventasDelTurno(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  turnoId: string,
): Promise<{ readonly desde: string; readonly ventas: readonly VentaPara[] }> {
  void businessId;
  const turnos = new DrizzleCajaTurnosRepository(db as never, deviceId as never);
  const tickets = new DrizzleTicketsRepository(db as never, deviceId as never);
  const sales = new DrizzleSalesRepository(db as never, deviceId as never);
  const clients = new DrizzleClientsRepository(db as never, deviceId as never);
  const turno = await turnos.findById(turnoId as never);
  const rows = await tickets.findByCajaTurno(turnoId as never);
  const ventas = await Promise.all(
    rows.map(async (t) => {
      const lineas = await sales.findByTicket(t.id);
      const monto = lineas.reduce((acc, l) => acc + (l.monto as bigint), 0n);
      const cliente =
        t.clienteId === null ? null : ((await clients.findById(t.clienteId))?.nombre ?? null);
      return {
        id: t.id,
        folio: t.folio,
        concepto: t.concepto,
        montoCentavos: monto.toString(),
        metodo: t.metodo,
        hora: t.hora ?? '',
        cliente,
        cancelada: t.cancelMotivo,
      };
    }),
  );
  return { desde: (turno?.aperturaAt ?? '').slice(11, 16), ventas };
}

/** Cancel a ticket through the real use case: PIN, permission, audit log (O-32). */
export async function cancelarTicket(
  db: Db,
  p: {
    readonly businessId: BusinessId;
    readonly deviceId: string;
    readonly userId: UserId;
    readonly ticketId: TicketId;
    readonly pin: string;
    readonly motivo: string;
  },
): Promise<{ readonly folio: number; readonly cashToReturnCentavos: string | null }> {
  const useCase = new CancelarTicketUseCase(
    new DrizzleTicketsRepository(db as never, p.deviceId as never, p.userId as never),
    new DrizzleSalesRepository(db as never, p.deviceId as never, p.userId as never),
    new DrizzleUsersRepository(db as never, p.deviceId as never),
    new DrizzleProductsRepository(db as never, p.deviceId as never),
    new DrizzleInventoryMovementsRepository(db as never, p.deviceId as never),
    new DrizzleCancelacionLogsRepository(db as never, p.deviceId as never, p.userId as never),
  );
  const r = await useCase.execute({ ...p, stockEnabled: false });
  return { folio: r.ticket.folio, cashToReturnCentavos: r.cashToReturn?.toString() ?? null };
}
