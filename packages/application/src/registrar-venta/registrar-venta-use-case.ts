/**
 * RegistrarVentaUseCase — the one-line ticket (ADR-073). The old UI's
 * single-product venta is `RegistrarTicketUseCase` with one line; this
 * wrapper keeps that surface while the checkout moves to full tickets.
 */

import type { Sale } from '@xangarro/domain';
import type {
  BusinessId,
  ClientId,
  Money,
  PaymentMethod,
  ProductId,
  SaleCategory,
  UserId,
  IsoDate,
} from '@xangarro/domain';
import type { RegistrarTicketUseCase } from '../registrar-ticket/index.js';
import type { UseCase } from '../_use-case.js';

/** The old single-product venta shape: line facts + the ticket's method/client. */
export interface RegistrarVentaInput {
  readonly fecha: IsoDate;
  readonly concepto: string;
  readonly categoria: SaleCategory;
  readonly monto: Money;
  /** Default Efectivo — the line fixtures no longer carry it (ADR-073). */
  readonly metodo?: PaymentMethod;
  readonly clienteId?: ClientId;
  readonly productoId: ProductId;
  readonly cantidad?: number;
  readonly efectivoRecibidoCentavos?: Money;
  readonly businessId: BusinessId;
}

export interface RegistrarVentaConfig {
  readonly stockEnabled?: boolean;
  readonly userId: UserId | null;
}

export class RegistrarVentaUseCase implements UseCase<RegistrarVentaInput, Sale> {
  readonly #tickets: RegistrarTicketUseCase;

  constructor(tickets: RegistrarTicketUseCase) {
    this.#tickets = tickets;
  }

  async execute(input: RegistrarVentaInput): Promise<Sale> {
    const { ticket, lineas } = await this.#tickets.execute({
      ticket: {
        fecha: input.fecha,
        concepto: input.concepto,
        metodo: input.metodo ?? 'Efectivo',
        clienteId: input.clienteId ?? null,
        efectivoRecibidoCentavos: input.efectivoRecibidoCentavos ?? null,
        businessId: input.businessId,
      },
      lineas: [
        {
          concepto: input.concepto,
          categoria: input.categoria,
          monto: input.monto,
          productoId: input.productoId,
          cantidad: input.cantidad ?? 1,
        },
      ],
    });
    void ticket;
    const linea = lineas[0];
    if (!linea) throw new TypeError('La línea no se registró');
    return linea;
  }
}
