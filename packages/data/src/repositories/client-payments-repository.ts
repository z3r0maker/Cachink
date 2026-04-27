/**
 * ClientPaymentsRepository — pagos against Crédito sales. Powers the
 * "estadoPago transitions to parcial/pagado" flow in RegistrarPagoClienteUseCase.
 */

import type {
  BusinessId,
  ClientPayment,
  ClientPaymentId,
  IsoDate,
  Money,
  NewClientPayment,
  SaleId,
} from '@cachink/domain';

export type { ClientPayment, NewClientPayment };

export interface ClientPaymentsRepository {
  create(input: NewClientPayment): Promise<ClientPayment>;
  findById(id: ClientPaymentId): Promise<ClientPayment | null>;
  findByVenta(ventaId: SaleId): Promise<readonly ClientPayment[]>;
  /** Sum of all non-deleted pagos against a given venta. Returns ZERO when none exist. */
  sumByVenta(ventaId: SaleId): Promise<Money>;
  /**
   * List all non-deleted pagos in `[from, to]` (inclusive) for a business.
   * Powers the Flujo de Efectivo "cash from CxC collections" line
   * (P1C-M8). Rows ordered newest first by fecha.
   */
  findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly ClientPayment[]>;
  delete(id: ClientPaymentId): Promise<void>;
}
