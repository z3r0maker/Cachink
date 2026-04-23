/**
 * SalesRepository — canonical example of the repository pattern used
 * throughout Cachink (see CLAUDE.md §4.3 and ADR-005).
 *
 * Every entity gets:
 *   1. A TypeScript interface defined here.
 *   2. A Drizzle implementation in `./drizzle/` (production).
 *   3. An in-memory implementation in `@cachink/testing` (tests).
 *
 * Use-cases in `@cachink/application` depend on the interface, never the
 * concrete implementation. Concrete implementations are injected at the
 * composition root of each app.
 */

import type {
  SaleId,
  ClientId,
  BusinessId,
  Money,
  IsoDate,
  IsoTimestamp,
} from '@cachink/domain';

/** Payment method. Matches the METODOS enum from CLAUDE.md §9. */
export type PaymentMethod =
  | 'Efectivo'
  | 'Transferencia'
  | 'Tarjeta'
  | 'QR/CoDi'
  | 'Crédito';

/** Sale category. Matches VENTAS_CAT. */
export type SaleCategory = 'Producto' | 'Servicio' | 'Anticipo' | 'Suscripción' | 'Otro';

/** Payment state for a sale. */
export type PaymentState = 'pagado' | 'pendiente' | 'parcial';

/** A recorded sale. */
export interface Sale {
  readonly id: SaleId;
  readonly fecha: IsoDate;
  readonly concepto: string;
  readonly categoria: SaleCategory;
  readonly monto: Money;
  readonly metodo: PaymentMethod;
  readonly clienteId: ClientId | null;
  readonly estadoPago: PaymentState;
  readonly businessId: BusinessId;
  readonly deviceId: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly deletedAt: IsoTimestamp | null;
}

/** Fields required to create a new sale. Audit fields are populated by the repository. */
export interface NewSale {
  readonly fecha: IsoDate;
  readonly concepto: string;
  readonly categoria: SaleCategory;
  readonly monto: Money;
  readonly metodo: PaymentMethod;
  readonly clienteId?: ClientId;
  readonly businessId: BusinessId;
}

/** Contract that both the Drizzle and in-memory implementations must satisfy. */
export interface SalesRepository {
  /** Create a new sale and return the persisted record. */
  create(sale: NewSale): Promise<Sale>;

  /** Look up a sale by its ID. Returns null if not found or soft-deleted. */
  findById(id: SaleId): Promise<Sale | null>;

  /** List all non-deleted sales for a given date, ordered by createdAt desc. */
  findByDate(date: IsoDate, businessId: BusinessId): Promise<readonly Sale[]>;

  /** List all pending/parcial Crédito sales for a given client. */
  findPendingByClient(clientId: ClientId): Promise<readonly Sale[]>;

  /** Update a sale's estadoPago (e.g. after a PagoCliente is registered). */
  updatePaymentState(id: SaleId, state: PaymentState): Promise<void>;

  /** Soft-delete a sale. */
  delete(id: SaleId): Promise<void>;
}
