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

/**
 * Partial-patch shape for `update()` per ADR-023. Immutable audit
 * fields (id, businessId, deviceId, createdAt) are excluded; the impl
 * bumps `updatedAt` internally. `estadoPago` is excluded — use the
 * existing `updatePaymentState(id, state)` helper since it has
 * additional invariant checks attached to it (PagoCliente flow).
 *
 * Audit Round 2 J1: enables per-row swipe-to-edit (Phase K wiring).
 */
export type SalePatch = Partial<
  Pick<Sale, 'fecha' | 'concepto' | 'categoria' | 'monto' | 'metodo' | 'clienteId'>
>;

/** Contract that both the Drizzle and in-memory implementations must satisfy. */
export interface SalesRepository {
  /** Create a new sale and return the persisted record. */
  create(sale: NewSale): Promise<Sale>;

  /** Look up a sale by its ID. Returns null if not found or soft-deleted. */
  findById(id: SaleId): Promise<Sale | null>;

  /** List all non-deleted sales for a given date, ordered by createdAt desc. */
  findByDate(date: string, businessId: BusinessId): Promise<readonly Sale[]>;

  /**
   * List all non-deleted sales in `[from, to]` (inclusive) for a business.
   * Powers the Phase 1C Estados Financieros + Informe mensual pipelines
   * (P1C-M7 / M8 / M9). Rows ordered newest first by fecha.
   */
  findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly Sale[]>;

  /** List all pending/parcial Crédito sales for a given client. */
  findPendingByClient(clientId: ClientId): Promise<readonly Sale[]>;

  /** Update a sale's estadoPago (e.g. after a PagoCliente is registered). */
  updatePaymentState(id: SaleId, state: PaymentState): Promise<void>;

  /**
   * Partial update per ADR-023. Returns the post-update row or null
   * when not found / soft-deleted. Excludes `estadoPago` (use
   * {@link updatePaymentState} instead).
   *
   * Audit Round 2 J1: powers swipe-to-edit on the Ventas list.
   */
  update(id: SaleId, patch: SalePatch): Promise<Sale | null>;

  /** Soft-delete a sale. */
  delete(id: SaleId): Promise<void>;

  /**
   * Count non-deleted sales for a business. Powers the wizard's
   * data-preserved callout (ADR-039) so the user sees their row counts
   * before changing modes on a re-run.
   */
  count(businessId: BusinessId): Promise<number>;
}
