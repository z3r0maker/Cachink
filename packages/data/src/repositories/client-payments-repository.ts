/**
 * ClientPaymentsRepository — a client's abonos (ADR-074). An abono belongs
 * to the client; how it settles their tickets is derived by
 * `estadoDeCuenta`, never stored here.
 */

import type {
  BusinessId,
  ClientId,
  ClientPayment,
  ClientPaymentId,
  IsoDate,
  NewClientPayment,
} from '@xangarro/domain';

export type { ClientPayment, NewClientPayment };

export interface ClientPaymentsRepository {
  create(input: NewClientPayment): Promise<ClientPayment>;
  findById(id: ClientPaymentId): Promise<ClientPayment | null>;
  /** A client's abonos, oldest first — the input to `estadoDeCuenta`. */
  findByCliente(clienteId: ClientId): Promise<readonly ClientPayment[]>;
  /**
   * List all non-deleted abonos in `[from, to]` (inclusive) for a business.
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
