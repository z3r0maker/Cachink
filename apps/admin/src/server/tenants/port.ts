/**
 * Ports for the tenant pages (N-06). The use cases in this folder depend on
 * these only; `memory.ts` implements them for tests, `../db/tenants.ts` and
 * `../db/plan-overrides.ts` for Postgres. Both honour the same contract:
 *
 * - `list` orders by `createdAt` desc, then `id` desc, applies every filter
 *   that is set, starts strictly after `after`, returns at most `limit`.
 * - `lastSyncAt` is the latest of every device's last push and last pull.
 */
import type { BusinessId, PlanOverride } from '@xangarro/domain';

export interface TenantCursor {
  readonly createdAt: string;
  readonly id: BusinessId;
}

export interface TenantSummary {
  readonly id: BusinessId;
  readonly nombre: string;
  /** As the database renders it; also the keyset position, so never re-rounded. */
  readonly createdAt: string;
  readonly ownerEmail: string | null;
  readonly devicesTotal: number;
  /** Not revoked. */
  readonly devicesActive: number;
  readonly lastSyncAt: string | null;
  /** Needs `auth.users.last_sign_in_at`, which the console cannot read yet. */
  readonly lastOwnerLoginAt: string | null;
}

export interface TenantQuery {
  /** Name or owner email (substring, case-insensitive) or exact business id. */
  readonly search?: string;
  /** Keep tenants whose last sync is before this instant, or who never synced. */
  readonly staleBefore?: string;
  /** Restrict to these ids (a billing filter's answer). */
  readonly onlyIds?: readonly BusinessId[];
  readonly after: TenantCursor | null;
  readonly limit: number;
}

export interface TenantMember {
  readonly userId: string;
  readonly email: string | null;
  readonly role: 'owner' | 'admin' | 'viewer';
}

export interface TenantDevice {
  readonly id: string;
  readonly nombre: string;
  readonly plataforma: string;
  readonly lastSeenAt: string | null;
  readonly revokedAt: string | null;
}

export interface TenantDirectory {
  list(query: TenantQuery): Promise<TenantSummary[]>;
  find(id: BusinessId): Promise<TenantSummary | null>;
  members(id: BusinessId): Promise<TenantMember[]>;
  devices(id: BusinessId): Promise<TenantDevice[]>;
}

/** Append-only: overrides end by expiring, so there is no update and no delete. */
export interface PlanOverrideRepository {
  insert(override: PlanOverride): Promise<void>;
  /** Every override of one tenant, newest first — the detail page's history. */
  listFor(businessId: BusinessId): Promise<PlanOverride[]>;
  /** Overrides of these tenants not yet expired at `now` (for the list page). */
  activeFor(ids: readonly BusinessId[], now: Date): Promise<PlanOverride[]>;
}
