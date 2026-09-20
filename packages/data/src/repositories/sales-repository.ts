/**
 * SalesRepository — a ticket's lines (ADR-073). The ticket-level facts
 * (method, client, payment state, cancellation, folio) live one table up,
 * in TicketsRepository; a line is product, quantity, amount.
 *
 * Use-cases in `@xangarro/application` depend on the interface, never the
 * concrete implementation. Concrete implementations are injected at the
 * composition root of each app.
 */

import type { Sale, NewSale, SaleCategory } from '@xangarro/domain';
import type { BusinessId, ProductId, SaleId } from '@xangarro/domain';

export type { Sale, NewSale, SaleCategory };

/** Partial-patch shape for `update()` per ADR-023. */
export type SalePatch = Partial<Pick<Sale, 'fecha' | 'concepto' | 'categoria' | 'monto'>>;

/** Contract that both the Drizzle and in-memory implementations must satisfy. */
export interface SalesRepository {
  /** Create a line of a ticket and return the persisted record. */
  create(sale: NewSale): Promise<Sale>;

  /** Look up a line by its ID. Returns null if not found or soft-deleted. */
  findById(id: SaleId): Promise<Sale | null>;

  /** List all non-deleted lines for a given date, ordered by createdAt desc. */
  findByDate(date: string, businessId: BusinessId): Promise<readonly Sale[]>;

  /**
   * List all non-deleted lines in `[from, to]` (inclusive) for a business.
   * Powers the Phase 1C Estados Financieros + Informe mensual pipelines
   * (P1C-M7 / M8 / M9). Rows ordered newest first by fecha.
   */
  findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly Sale[]>;

  /** Every non-deleted line of one ticket. */
  findByTicket(ticketId: Sale['ticketId']): Promise<readonly Sale[]>;

  /**
   * Partial update per ADR-023. Returns the post-update row or null
   * when not found / soft-deleted.
   */
  update(id: SaleId, patch: SalePatch): Promise<Sale | null>;

  /** Soft-delete a line. */
  delete(id: SaleId): Promise<void>;

  /**
   * Count non-deleted lines for a business. Powers the wizard's
   * data-preserved callout (ADR-039) so the user sees their row counts
   * before changing modes on a re-run.
   */
  count(businessId: BusinessId): Promise<number>;

  /**
   * Find the most frequently sold productoIds within a date window.
   * Returns rows sorted by sale count descending, limited to `limit`.
   * Powers the "frequent products" grid on the Ventas screen (UXD-R3).
   */
  findFrequentProductoIds(opts: {
    businessId: BusinessId;
    since: string;
    limit: number;
  }): Promise<readonly { productoId: ProductId; veces: number; ultimaVenta: string }[]>;
}
