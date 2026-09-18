/**
 * Free-tier product cap (N-04, ADR-065). The only hard limit: the free plan
 * cannot create a product beyond `activeProducts`. Paid plans never refuse —
 * their product limit is advisory. The server still accepts overflow rows
 * from offline phones; this check is for the portal and the app quick-add.
 */

import { FALLBACK_PLAN, type PlanId } from '../entities/plan.js';
import { InvalidUsageCountError } from './errors.js';
import { assertUsageLimits } from './limits.js';
import type { UsageLimits } from './types.js';

export type ProductCapResult =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly code: 'PRODUCT_CAP_REACHED';
      readonly limit: number;
      /** How many of the requested products do not fit ("excede tu plan por N"). */
      readonly excess: number;
    };

/**
 * The free tier is the plan a lapsed entitlement falls back to — derived
 * from plan data rather than a literal tier name.
 */
export function isFreePlan(planId: PlanId): boolean {
  return planId === FALLBACK_PLAN;
}

function assertCount(field: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min) throw new InvalidUsageCountError(field, value);
}

/**
 * Whether `adding` more products fit, given `activeProducts` already active.
 * Returns a result, never throws for "over the cap".
 */
export function canCreateProduct(
  activeProducts: number,
  limits: UsageLimits,
  planId: PlanId,
  adding = 1,
): ProductCapResult {
  assertCount('activeProducts', activeProducts, 0);
  assertCount('adding', adding, 1);
  assertUsageLimits(limits);
  const limit = limits.activeProducts;
  if (!isFreePlan(planId) || limit === null) return { allowed: true };
  const excess = activeProducts + adding - limit;
  if (excess <= 0) return { allowed: true };
  return { allowed: false, code: 'PRODUCT_CAP_REACHED', limit, excess: Math.min(excess, adding) };
}
