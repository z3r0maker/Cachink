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
 *
 * The `Sale` / `NewSale` / `PaymentMethod` / `SaleCategory` / `PaymentState`
 * types live in `@cachink/domain/entities` as Zod schemas (P1B-M2-T02); we
 * re-export them here so downstream consumers (e.g. `@cachink/testing`) keep
 * a single import path.
 */

import type { Sale, NewSale, PaymentMethod, PaymentState, SaleCategory } from '@cachink/domain';
import type { BusinessId, ClientId, SaleId } from '@cachink/domain';

export type { Sale, NewSale, PaymentMethod, PaymentState, SaleCategory };

/** Contract that both the Drizzle and in-memory implementations must satisfy. */
export interface SalesRepository {
  /** Create a new sale and return the persisted record. */
  create(sale: NewSale): Promise<Sale>;

  /** Look up a sale by its ID. Returns null if not found or soft-deleted. */
  findById(id: SaleId): Promise<Sale | null>;

  /** List all non-deleted sales for a given date, ordered by createdAt desc. */
  findByDate(date: string, businessId: BusinessId): Promise<readonly Sale[]>;

  /** List all pending/parcial Crédito sales for a given client. */
  findPendingByClient(clientId: ClientId): Promise<readonly Sale[]>;

  /** Update a sale's estadoPago (e.g. after a PagoCliente is registered). */
  updatePaymentState(id: SaleId, state: PaymentState): Promise<void>;

  /** Soft-delete a sale. */
  delete(id: SaleId): Promise<void>;
}
