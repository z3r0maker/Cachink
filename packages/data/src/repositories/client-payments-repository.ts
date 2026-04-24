/**
 * ClientPaymentsRepository — pagos against Crédito sales. Powers the
 * "estadoPago transitions to parcial/pagado" flow in RegistrarPagoClienteUseCase.
 */

import type {
  ClientPayment,
  ClientPaymentId,
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
  delete(id: ClientPaymentId): Promise<void>;
}
