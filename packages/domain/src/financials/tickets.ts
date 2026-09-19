/**
 * Ticket + lines → the projections the calculators take (ADR-073). A
 * ticket's total is the sum of its lines' amounts — derived, never stored —
 * so this is the one place that joins a header to its lines.
 */

import type { Sale, Ticket } from '../entities/index.js';
import type { TicketId } from '../ids/index.js';
import type { Money } from '../money/index.js';
import { ZERO } from '../money/index.js';

/** A ticket with its derived total. */
export interface TicketConTotal {
  readonly ticket: Ticket;
  readonly total: Money;
}

export function conTotales(
  tickets: readonly Ticket[],
  lineas: readonly Sale[],
): readonly TicketConTotal[] {
  const porTicket = new Map<TicketId, Money>();
  for (const linea of lineas) {
    if (linea.deletedAt !== null) continue;
    porTicket.set(linea.ticketId, (porTicket.get(linea.ticketId) ?? ZERO) + linea.monto);
  }
  return tickets.map((ticket) => ({ ticket, total: porTicket.get(ticket.id) ?? ZERO }));
}

/** Only tickets that still stand — a cancellation refunds every line. */
export const vigentes = (tickets: readonly Ticket[]): readonly Ticket[] =>
  tickets.filter((t) => t.cancelledAt === null && t.deletedAt === null);
