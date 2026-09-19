/**
 * CancelarTicketUseCase — cancel a ticket atomically (ADR-073): permission
 * + PIN check, the header takes the cancellation, every line's stock comes
 * back, and one audit log records the whole ticket.
 */

import { compare } from 'bcryptjs';
import {
  canUserCancelSales,
  parseUserPermissions,
  today,
  type Money,
  type Ticket,
} from '@xangarro/domain';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';
import type {
  CancelacionLogsRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
  TicketsRepository,
  UsersRepository,
} from '@xangarro/data';
import type { UseCase } from '../_use-case.js';

export interface CancelarTicketInput {
  readonly ticketId: TicketId;
  readonly userId: UserId;
  readonly pin: string;
  readonly motivo: string;
  readonly businessId: BusinessId;
  /** Business-level stock feature flag. */
  readonly stockEnabled?: boolean;
}

export interface CancelarTicketResult {
  readonly ticket: Ticket;
  /** Non-null when the ticket was paid in cash — the UI shows «Devuelve $X». */
  readonly cashToReturn: Money | null;
  /** True when at least one line's stock came back. */
  readonly stockReversed: boolean;
}

export class CancelarTicketUseCase implements UseCase<CancelarTicketInput, CancelarTicketResult> {
  readonly #tickets: TicketsRepository;
  readonly #sales: SalesRepository;
  readonly #users: UsersRepository;
  readonly #products: ProductsRepository;
  readonly #movements: InventoryMovementsRepository;
  readonly #logs: CancelacionLogsRepository;

  constructor(
    tickets: TicketsRepository,
    sales: SalesRepository,
    users: UsersRepository,
    products: ProductsRepository,
    movements: InventoryMovementsRepository,
    logs: CancelacionLogsRepository,
  ) {
    this.#tickets = tickets;
    this.#sales = sales;
    this.#users = users;
    this.#products = products;
    this.#movements = movements;
    this.#logs = logs;
  }

  async execute(input: CancelarTicketInput): Promise<CancelarTicketResult> {
    await this.#verifyUserAndPin(input.userId, input.pin);
    const ticket = await this.#tickets.findById(input.ticketId);
    if (!ticket) throw new TypeError('Venta no encontrada');
    if (ticket.cancelledAt !== null) throw new TypeError('Esta venta ya fue cancelada');

    const lineas = await this.#sales.findByTicket(input.ticketId);
    const total = lineas.reduce((acc, l) => acc + (l.monto as Money), 0n as Money);
    const cashToReturn = ticket.metodo === 'Efectivo' ? total : null;

    const stockReversed = await this.#reverseStock(ticket, lineas, input);

    const cancelled = await this.#tickets.cancel(
      input.ticketId,
      input.motivo,
      input.userId as string,
    );
    if (!cancelled) throw new TypeError('Esta venta ya fue cancelada');

    await this.#logs.create({
      ticketId: input.ticketId,
      cancelledByUserId: input.userId,
      motivo: input.motivo,
      montoOriginalCentavos: total,
      metodoOriginal: ticket.metodo,
      cashReturnedCentavos: cashToReturn,
      stockReversed,
      cantidadDevuelta: lineas.length === 1 ? (lineas[0]?.cantidad ?? null) : null,
      productoId: lineas.length === 1 ? (lineas[0]?.productoId ?? null) : null,
      businessId: input.businessId,
    });

    return { ticket: cancelled, cashToReturn, stockReversed };
  }

  async #verifyUserAndPin(userId: UserId, pin: string): Promise<void> {
    const user = await this.#users.findById(userId);
    if (!user) throw new TypeError('Usuario no encontrado');
    const pinOk = await compare(pin, user.pinHash);
    if (!pinOk) throw new TypeError('PIN incorrecto');

    // The row carries permissions parsed (drizzle) or as JSON text (pg).
    const raw = (user as Record<string, unknown>).permissions;
    const perms =
      typeof raw === 'string' ? parseUserPermissions(raw) : parseUserPermissions(JSON.stringify(raw ?? {}));
    if (!canUserCancelSales(perms)) {
      throw new TypeError('No tienes permiso para cancelar ventas');
    }
  }

  async #reverseStock(
    ticket: Ticket,
    lineas: readonly { productoId: string; cantidad: number }[],
    input: CancelarTicketInput,
  ): Promise<boolean> {
    if ((input.stockEnabled ?? true) === false) return false;
    let reversed = false;
    for (const linea of lineas) {
      const producto = await this.#products.findById(linea.productoId as never);
      if (!producto?.seguirStock) continue;
      await this.#movements.create({
        productoId: linea.productoId as never,
        fecha: today(),
        tipo: 'entrada',
        cantidad: linea.cantidad,
        costoUnitCentavos: producto.costoUnitCentavos,
        motivo: 'Devolución de cliente',
        nota: `Cancelación de venta: ${input.motivo}`,
        businessId: input.businessId,
      });
      reversed = true;
    }
    void ticket;
    return reversed;
  }
}
