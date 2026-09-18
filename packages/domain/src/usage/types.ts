/**
 * Usage metering types (N-02 / N-03, ADR-065, OQ-5).
 *
 * `UsageLimits` is deliberately an input shape rather than a read of
 * `PLAN_LIMITS`: C-12 will add `transactionsPerMonth` and `activeProducts` to
 * the plan table, and until then callers pass the values in.
 */

/** Monthly and catalog limits; `null` = unlimited. Positive integers otherwise. */
export interface UsageLimits {
  readonly transactionsPerMonth: number | null;
  readonly activeProducts: number | null;
}

/** The two metrics ADR-065 meters. */
export const USAGE_METRICS = ['transactions', 'activeProducts'] as const;
export type UsageMetric = (typeof USAGE_METRICS)[number];

/** Business-local month, `'YYYY-MM'`. */
export type UsagePeriod = string;

/** Counts for one business in one period. */
export interface UsageCounts {
  readonly transactions: number;
  readonly activeProducts: number;
}

/** Counts tagged with the period they belong to (closed-month history). */
export interface PeriodUsage extends UsageCounts {
  readonly period: UsagePeriod;
}

/** Counts tagged with business and period — the `usage_counters` row. */
export interface UsageSnapshot extends PeriodUsage {
  readonly businessId: string;
}

/**
 * Where an inventory movement came from. `manual` (a phone) and `portal` (the
 * owner, in the portal) count (OQ-5, C-12); the others are stock changes
 * another use case wrote on the user's behalf.
 */
export type MovementOrigin = 'manual' | 'portal' | 'venta' | 'cancelacion' | 'conversion';

/** Review status of a product created at the register (ADR-074). */
export type ProductReviewStatus = 'pendiente' | 'aprobado' | 'fusionado' | 'rechazado';

/** Record kinds that are never transactions (OQ-5). */
export type NonCountedKind =
  | 'cancelacion'
  | 'corteDeDia'
  | 'cajaMovimiento'
  | 'cajaTurno'
  | 'abono'
  | 'mensajeOperador';

/**
 * A synced row as usage metering sees it. `at` is an ISO-8601 instant that
 * places the row in a period (the caller chooses which timestamp — see
 * `computeUsage`).
 */
export type UsageRecord =
  /** ADR-073 ticket (sale header). */
  | { readonly kind: 'ticket'; readonly at: string }
  /** A sale line; `ticketId: null` = pre-ADR-073 sale, itself a one-line ticket. */
  | { readonly kind: 'ventaLinea'; readonly at: string; readonly ticketId: string | null }
  | { readonly kind: 'gasto'; readonly at: string }
  | { readonly kind: 'movimientoInventario'; readonly at: string; readonly origen: MovementOrigin }
  | { readonly kind: NonCountedKind; readonly at: string }
  | {
      readonly kind: 'producto';
      readonly deletedAt: string | null;
      readonly estadoRevision?: ProductReviewStatus;
    };

/** Threshold percentages (ADR-065). */
export const USAGE_THRESHOLDS = [80, 100, 150] as const;
export type UsageThreshold = (typeof USAGE_THRESHOLDS)[number];

export type UsageRecipient = 'owner' | 'provider';
