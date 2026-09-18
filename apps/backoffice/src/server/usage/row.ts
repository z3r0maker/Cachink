import type { BusinessId, PlanOverride } from '@xangarro/domain';
import {
  consecutiveMonthsOver,
  type PeriodUsage,
  type UsageLimits,
  type UsagePeriod,
} from '@xangarro/domain/usage';

import { UNKNOWN_BILLING, type BillingStatusSource } from '../billing/port';
import { tenantStore } from '../tenants/errors';
import { limitsOf, planView, type PlanView } from '../tenants/plan-view';
import type { PlanOverrideRepository } from '../tenants/port';
import { previousUsagePeriod, usageByMetric, usageLimitsOf, type UsageByMetric } from './limits';
import type { TenantUsage } from './port';

/** One tenant as the usage page shows it. */
export interface UsageRow {
  readonly tenant: TenantUsage;
  readonly plan: PlanView;
  readonly limits: UsageLimits;
  readonly current: UsageByMetric;
  readonly previous: PeriodUsage | null;
  /** Any metric at or over 100 % this month. */
  readonly overLimit: boolean;
  /** The last two closed months both at or over 100 % ("sugerir upgrade", N-03). */
  readonly twoMonthsOver: boolean;
}

export interface UsageRowDeps {
  readonly billing: BillingStatusSource;
  readonly overrides: PlanOverrideRepository;
}

const ZERO = { transactions: 0, activeProducts: 0 } as const;

function toRow(tenant: TenantUsage, plan: PlanView, period: UsagePeriod): UsageRow {
  const limits = usageLimitsOf(limitsOf(plan));
  const now = tenant.history.find((h) => h.period === period) ?? { ...ZERO, period };
  const previous = tenant.history.find((h) => h.period === previousUsagePeriod(period)) ?? null;
  const current = usageByMetric(now, limits, period);
  return {
    tenant,
    plan,
    limits,
    current,
    previous,
    overLimit: Object.values(current).some((m) => m.band !== null && m.band >= 100),
    twoMonthsOver: consecutiveMonthsOver(tenant.history, limits, { currentPeriod: period }),
  };
}

/**
 * Attach each tenant's plan (Stripe's, after staff overrides — the same rule
 * as the tenant list) and score its usage against that plan's limits.
 */
export async function usageRows(
  deps: UsageRowDeps,
  page: readonly TenantUsage[],
  period: UsagePeriod,
  now: Date,
): Promise<UsageRow[]> {
  if (page.length === 0) return [];
  const ids = page.map((t) => t.id);
  const [snapshots, active] = await Promise.all([
    tenantStore(() => deps.billing.snapshots(ids)),
    tenantStore(() => deps.overrides.activeFor(ids, now)),
  ]);
  const byTenant = new Map<BusinessId, PlanOverride[]>();
  for (const o of active) byTenant.set(o.businessId, [...(byTenant.get(o.businessId) ?? []), o]);
  return page.map((t) => {
    const view = planView(snapshots.get(t.id) ?? UNKNOWN_BILLING, byTenant.get(t.id) ?? [], now);
    return toRow(t, view, period);
  });
}
