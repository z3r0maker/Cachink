/**
 * useFeatureFlags / useFeatureFlag — effective feature flags (A-14):
 * platform availability × the verified entitlement's plan × the tenant
 * toggles the portal synced onto the business row.
 *
 * Until the entitlement has loaded, or when nothing verifies, the plan is
 * the Freelancer fallback — a feature is never on because of a missing or
 * forged entitlement.
 */

import {
  DEFAULT_FEATURE_FLAGS,
  FALLBACK_PLAN,
  PLATFORM_AVAILABLE,
  parseFeatureFlags,
  resolveEffectiveFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@xangarro/domain';
import { useEntitlement } from '../entitlement/use-entitlement';
import { useCurrentBusiness } from './use-current-business';

export function useFeatureFlags(): FeatureFlags {
  const { data: business } = useCurrentBusiness();
  const entitlement = useEntitlement();
  const tenant = business ? parseFeatureFlags(business.featureFlags) : DEFAULT_FEATURE_FLAGS;
  return resolveEffectiveFlags({
    platform: PLATFORM_AVAILABLE,
    plan: entitlement?.plan ?? FALLBACK_PLAN,
    tenant,
  });
}

/** Single flag convenience hook. */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}
