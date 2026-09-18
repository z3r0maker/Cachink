/**
 * `BillingStatusSource` — where the console learns a tenant's Stripe state
 * (N-06, ADR-063: "Stripe remains the billing source of truth; the admin
 * reads webhook-derived state").
 *
 * The real adapter reads the webhook-maintained `billing.subscriptions`
 * table once B-10 gives it a writer. Until then `stub.ts` answers `unknown`
 * for everyone — the console never calls Stripe itself.
 */
import type { BusinessId, PlanId } from '@xangarro/domain';

/**
 * The statuses of `SubscriptionStatus` in `@xangarro/application`
 * (`compute-entitlement.ts` on main), plus `unknown` for "no billing data
 * yet". Mirrored rather than imported: the console does not depend on
 * `application`, and these are display values here, not rules.
 */
export const BILLING_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'grace',
  'lapsed',
  'free',
  'unknown',
] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

export interface BillingSnapshot {
  /** The plan Stripe bills for; null when unknown. */
  readonly planId: PlanId | null;
  readonly status: BillingStatus;
  readonly interval: 'month' | 'year' | null;
  /** Next charge (or trial end), ISO-8601. */
  readonly currentPeriodEnd: string | null;
  /** `cus_…`, for the link to the Stripe Dashboard. */
  readonly stripeCustomerId: string | null;
}

export const UNKNOWN_BILLING: BillingSnapshot = {
  planId: null,
  status: 'unknown',
  interval: null,
  currentPeriodEnd: null,
  stripeCustomerId: null,
};

export interface BillingFilter {
  readonly plan?: PlanId;
  readonly status?: BillingStatus;
}

/** Which tenants a billing filter keeps: all of them, or exactly these. */
export type BillingMatch =
  | { readonly kind: 'all' }
  | { readonly kind: 'only'; readonly businessIds: readonly BusinessId[] };

export interface BillingStatusSource {
  /** False while no adapter has real billing data (the B-10 stub); the list says so. */
  readonly known: boolean;
  /** One snapshot per id asked for; ids with no billing row map to `UNKNOWN_BILLING`. */
  snapshots(ids: readonly BusinessId[]): Promise<ReadonlyMap<BusinessId, BillingSnapshot>>;
  matching(filter: BillingFilter): Promise<BillingMatch>;
}
