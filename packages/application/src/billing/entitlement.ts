/**
 * The entitlement a business has right now: its billing rows plus what the
 * console set (N-09, N-06). The one rule both the portal and its phones get
 * their plan from.
 *
 * - **Platform flags** (N-09): `features` is the plan's features ∩ what the
 *   platform has released to this business. A key staff switch off leaves the
 *   entitlement on the next pull; phones take platform availability from it.
 * - **Comp** (N-06): the highest active `comp_plan` lifts — never lowers —
 *   the plan until it expires. No grace after it: a gift has a date, and on
 *   the next pull after it the business is back on its own plan.
 * - **Trial extension** (N-06): active `extend_trial` days move the trial's
 *   end, even after Stripe ended the trial — the extension is staff's word,
 *   and Stripe's own trial end is corrected separately (N-71).
 * - **Reissue** needs nothing here: every entitlement is computed and signed
 *   per request and never stored, so the next pull already carries a fresh one.
 */
import {
  effectivePlan,
  FALLBACK_PLAN,
  PLATFORM_FLAG_DEFAULTS,
  type Entitlement,
  type PlanOverrideFacts,
  type PlatformFlagKey,
} from '@xangarro/domain';

import { computeEntitlement, type SubscriptionSnapshot } from '../compute-entitlement/index.js';
import type { SubscriptionRecord } from './ports.js';
import { currentSubscription, toSnapshot } from './status.js';

export interface EntitlementInputs {
  /** The business's own overrides, active or not; the rule filters by time. */
  readonly overrides: readonly PlanOverrideFacts[];
  /** Every platform key, already resolved for this business (`resolvePlatformFlags`). */
  readonly platform: Readonly<Record<PlatformFlagKey, boolean>>;
}

export const NO_ENTITLEMENT_INPUTS: EntitlementInputs = {
  overrides: [],
  platform: PLATFORM_FLAG_DEFAULTS,
};

const DAY = 86_400_000;

/** The billing snapshot, with any trial extension applied to the trial's end. */
function extendedSnapshot(
  record: SubscriptionRecord | null,
  days: number,
): SubscriptionSnapshot | null {
  const snapshot = toSnapshot(record);
  if (record === null || days <= 0 || record.trialEnd === null) return snapshot;
  if (record.status !== 'trialing' && record.status !== 'lapsed') return snapshot;
  const end = new Date(Date.parse(record.trialEnd) + days * DAY).toISOString();
  return { planId: record.planId, status: 'trialing', currentPeriodEnd: end };
}

function withPlatform(e: Entitlement, platform: EntitlementInputs['platform']): Entitlement {
  return { ...e, features: e.features.filter((k) => platform[k]) };
}

export function entitlementFromBilling(
  businessId: string,
  rows: readonly SubscriptionRecord[],
  now: Date,
  inputs: EntitlementInputs = NO_ENTITLEMENT_INPUTS,
): Entitlement {
  const { trialExtensionDays } = effectivePlan(FALLBACK_PLAN, inputs.overrides, now);
  const snapshot = extendedSnapshot(currentSubscription(rows), trialExtensionDays);
  const base = computeEntitlement(businessId, snapshot, now);
  const comp = effectivePlan(base.plan, inputs.overrides, now);
  if (comp.compedUntil === null) return withPlatform(base, inputs.platform);
  const comped = computeEntitlement(
    businessId,
    { planId: comp.plan, status: 'active', currentPeriodEnd: comp.compedUntil },
    now,
  );
  return withPlatform({ ...comped, graceUntil: comped.validUntil }, inputs.platform);
}
