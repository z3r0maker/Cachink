/**
 * CancelarVentaUseCase — the one-line surface over CancelarTicket (ADR-073).
 * Cancelling any line of a ticket cancels the whole ticket; the wrapper
 * finds the line's ticket and delegates.
 */

import type { Money, Sale } from '@xangarro/domain';
import type { BusinessId, SaleId, UserId } from '@xangarro/domain';
import type { SalesRepository } from '@xangarro/data';
import type { CancelarTicketUseCase } from '../cancelar-ticket/index.js';
import type { UseCase } from '../_use-case.js';

export interface CancelarVentaInput {
  readonly saleId: SaleId;
  readonly userId: UserId;
  readonly pin: string;
  readonly motivo: string;
  readonly businessId: BusinessId;
  readonly stockEnabled?: boolean;
}

export interface CancelarVentaResult {
  readonly sale: Sale;
  /** Non-null if cash was the payment method — UI shows "Devuelve $X". */
  readonly cashToReturn: Money | null;
  readonly stockReversed: boolean;
  readonly cantidadDevuelta: number | null;
}

export class CancelarVentaUseCase implements UseCase<CancelarVentaInput, CancelarVentaResult> {
  readonly #sales: SalesRepository;
  readonly #tickets: CancelarTicketUseCase;

  constructor(sales: SalesRepository, tickets: CancelarTicketUseCase) {
    this.#sales = sales;
    this.#tickets = tickets;
  }

  async execute(input: CancelarVentaInput): Promise<CancelarVentaResult> {
    const line = await this.#sales.findById(input.saleId);
    if (!line) throw new TypeError('Venta no encontrada');
    const result = await this.#tickets.execute({ ...input, ticketId: line.ticketId });
    return {
      sale: line,
      cashToReturn: result.cashToReturn,
      stockReversed: result.stockReversed,
      cantidadDevuelta: null,
    };
  }
}
