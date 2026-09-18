/**
 * Port for the usage page (N-07). `memory.ts` implements it with the domain's
 * `computeUsage`, `../db/usage.ts` with `admin_tenant_usage()`
 * (0005_admin_usage_read.sql). Both honour the same contract:
 *
 * - tenants newest first (`createdAt` desc, then `id` desc), strictly after
 *   `after`, at most `limit`;
 * - each tenant's `history` holds exactly three months: `period` and the two
 *   before it, counted per OQ-5 (see `countsTowardUsage`).
 *
 * When N-02's `usage_counters` lands, a third adapter reads it and the
 * recompute-on-read one retires; nothing above this port changes.
 */
import type { BusinessId } from '@xangarro/domain';
import type { PeriodUsage, UsagePeriod } from '@xangarro/domain/usage';

export interface UsageCursor {
  readonly createdAt: string;
  readonly id: BusinessId;
}

export interface TenantUsage {
  readonly id: BusinessId;
  readonly nombre: string;
  /** As the database renders it; also the keyset position. */
  readonly createdAt: string;
  readonly history: readonly PeriodUsage[];
}

export interface UsagePageQuery {
  /** The open month, business-local (`usagePeriod(now)`). */
  readonly period: UsagePeriod;
  readonly after: UsageCursor | null;
  readonly limit: number;
}

export interface UsageSource {
  page(query: UsagePageQuery): Promise<TenantUsage[]>;
}
