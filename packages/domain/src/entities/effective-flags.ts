/**
 * Effective feature flags = platform availability × plan entitlement × tenant
 * toggle, then dependency cascade (docs/plan Q10 / Q14).
 *
 * Pure: the device resolves this from its synced tenant JSON + its signed
 * entitlement; the portal resolves it from the same inputs server-side.
 */

import {
  FEATURE_FLAG_DEPENDENCIES,
  FEATURE_FLAG_KEYS,
  type FeatureFlagKey,
  type FeatureFlags,
} from './feature-flags.js';
import { PLAN_LIMITS, type PlanId } from './plan.js';

export interface EffectiveFlagsInput {
  readonly platform: FeatureFlags;
  readonly plan: PlanId;
  readonly tenant: FeatureFlags;
}

function planIncludes(plan: PlanId, key: FeatureFlagKey): boolean {
  return PLAN_LIMITS[plan].features.includes(key);
}

/** A child is only on when its parent chain is on (two passes cover chains of 3). */
function applyDependencies(flags: FeatureFlags): FeatureFlags {
  const result = { ...flags };
  const deps = Object.entries(FEATURE_FLAG_DEPENDENCIES) as [FeatureFlagKey, FeatureFlagKey][];
  for (let pass = 0; pass < 2; pass += 1) {
    for (const [child, parent] of deps) {
      if (!result[parent]) result[child] = false;
    }
  }
  return result;
}

export function resolveEffectiveFlags(input: EffectiveFlagsInput): FeatureFlags {
  const raw = {} as FeatureFlags;
  for (const key of FEATURE_FLAG_KEYS) {
    raw[key] = input.platform[key] && planIncludes(input.plan, key) && input.tenant[key];
  }
  return applyDependencies(raw);
}
