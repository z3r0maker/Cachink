/**
 * A plan's limits in the usage core's shape (N-02 / N-07, C-12).
 *
 * The plan table carries the two ADR-065 metrics since C-12 — the mapper
 * stays because the admin console and the nightly recompute should never
 * read a plan differently.
 */

import type { PlanLimits } from '../entities/plan.js';
import type { UsageLimits } from './types.js';

export function usageLimitsOf(plan: PlanLimits): UsageLimits {
  return { transactionsPerMonth: plan.transactionsPerMonth, activeProducts: plan.activeProducts };
}
