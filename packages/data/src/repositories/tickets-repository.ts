/**
 * TicketsRepository — the sale header (ADR-073): folio, method, client,
 * payment state, cancellation and the turno. `sales` are its lines.
 *
 * The folio is a per-device counter assigned at capture (offline-safe:
 * only this device writes its own folios), unique on (device, folio).
 */

import type { NewTicket, PaymentState, Ticket } from '@xangarro/domain';
import type { BusinessId, CajaTurnoId, ClientId, TicketId } from '@xangarro/domain';

export type { Ticket, NewTicket, PaymentState };

export interface TicketsRepository {
  /** Create a ticket header and return the persisted record. */
  create(ticket: NewTicket): Promise<Ticket>;

  /** Look up a ticket by its ID. Returns null if not found or soft-deleted. */
  findById(id: TicketId): Promise<Ticket | null>;

  /**
   * This repository's device next folio: max(folio) + 1 within the
   * business. Assigned at capture, before the ticket is written, so it
   * works offline — only this device writes its own folios.
   */
  nextFolio(businessId: BusinessId): Promise<number>;

  /** List non-deleted tickets for a given date, newest first. */
  findByDate(date: string, businessId: BusinessId): Promise<readonly Ticket[]>;

  /** The turno's non-deleted tickets, newest first — the register's Ventas list. */
  findByCajaTurno(cajaTurnoId: CajaTurnoId): Promise<readonly Ticket[]>;

  /** List non-deleted tickets in `[from, to]` (inclusive) for a business. */
  findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly Ticket[]>;

  /** Pending/parcial Crédito tickets of one client, oldest first. */
  findPendingByClient(clientId: ClientId): Promise<readonly Ticket[]>;

  /** Every Crédito ticket of one client — the account's fiado history (ADR-074). */
  findCreditoByClient(clientId: ClientId): Promise<readonly Ticket[]>;

  /** Update a ticket's estadoPago (e.g. after abonos). */
  updatePaymentState(id: TicketId, state: PaymentState): Promise<void>;

  /**
   * Cancel a standing ticket: stamp who, why and when. Lines stay for
   * history; stock reversal is the use case's business.
   */
  cancel(id: TicketId, motivo: string, cancelledByUserId: string): Promise<Ticket | null>;

  /** Soft-delete a ticket. */
  delete(id: TicketId): Promise<void>;
}
