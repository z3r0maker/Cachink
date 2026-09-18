/**
 * A plan's limits in the usage core's shape (N-02 / N-07).
 *
 * `PLAN_LIMITS` today has one metric, `recordsPerMonth`, and no product
 * limit. C-12 adds `transactionsPerMonth` and `activeProducts` to the plan
 * table (ADR-065: 300 / 50 · 10 000 / 1 000 · 30 000 / 5 000); this mapper is
 * then replaced by reading those two fields. One mapper, so the admin console
 * and the nightly recompute can never read a plan differently.
 */

import type { PlanLimits } from '../entities/plan.js';
import type { UsageLimits } from './types.js';

export function usageLimitsOf(plan: PlanLimits): UsageLimits {
  return { transactionsPerMonth: plan.recordsPerMonth, activeProducts: null };
}
