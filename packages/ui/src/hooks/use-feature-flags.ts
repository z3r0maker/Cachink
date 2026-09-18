/**
 * useFeatureFlags / useFeatureFlag — read feature flags from the
 * current business record.
 *
 * Parses the JSON `featureFlags` field from the Business entity.
 * Returns defaults when the business is not loaded yet.
 *
 * Phase 3 of the Feature Flags plan.
 */

import {
  DEFAULT_FEATURE_FLAGS,
  PLATFORM_AVAILABLE,
  parseFeatureFlags,
  resolveEffectiveFlags,
  type FeatureFlagKey,
  type FeatureFlags,
  type PlanId,
} from '@xangarro/domain';
import { useCurrentBusiness } from './use-current-business';

/**
 * Until A-10 wires the signed entitlement, the device assumes the most
 * permissive plan so that platform availability is the only clamp — which
 * is exactly the pre-pivot MVP behaviour (stock + barcode on, the rest dark).
 */
const DEVICE_PLAN_UNTIL_ENTITLEMENT: PlanId = 'xangarrote';

/** Effective flags (platform × plan × tenant) for the current business. */
export function useFeatureFlags(): FeatureFlags {
  const { data: business } = useCurrentBusiness();
  const tenant = business ? parseFeatureFlags(business.featureFlags) : DEFAULT_FEATURE_FLAGS;
  return resolveEffectiveFlags({
    platform: PLATFORM_AVAILABLE,
    plan: DEVICE_PLAN_UNTIL_ENTITLEMENT,
    tenant,
  });
}

/** Single flag convenience hook. */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}
