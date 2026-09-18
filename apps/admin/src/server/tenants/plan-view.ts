import {
  effectivePlan,
  FALLBACK_PLAN,
  PLAN_LIMITS,
  type EffectivePlan,
  type PlanId,
  type PlanLimits,
  type PlanOverride,
} from '@xangarro/domain';

import type { BillingSnapshot } from '../billing/port';

/**
 * What the console shows as a tenant's plan: Stripe's plan (`base`, null
 * while unknown) and the plan after overrides (`effective`, null only when
 * neither Stripe nor a comp says anything). The rule itself is the domain's
 * `effectivePlan`; this only keeps "unknown" honest instead of showing the
 * fallback plan as if Stripe had said so.
 */
export interface PlanView {
  readonly base: PlanId | null;
  readonly effective: PlanId | null;
  readonly effect: EffectivePlan;
}

export function planView(
  billing: BillingSnapshot,
  overrides: readonly PlanOverride[],
  now: Date,
): PlanView {
  const effect = effectivePlan(billing.planId ?? FALLBACK_PLAN, overrides, now);
  const known = billing.planId !== null || effect.compedBy !== null;
  return { base: billing.planId, effective: known ? effect.plan : null, effect };
}

/** The limits the next entitlement would carry; unknown billing is the free plan (B-06). */
export function limitsOf(view: PlanView): PlanLimits {
  return PLAN_LIMITS[view.effective ?? FALLBACK_PLAN];
}
