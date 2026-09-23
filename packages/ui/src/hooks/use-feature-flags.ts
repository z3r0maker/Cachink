/**
 * useFeatureFlags / useFeatureFlag — effective feature flags (A-14):
 * platform availability × the verified entitlement's plan × the tenant
 * toggles the portal synced onto the business row.
 *
 * Until the entitlement has loaded, or when nothing verifies, the plan is
 * the Freelancer fallback — a feature is never on because of a missing or
 * forged entitlement.
 *
 * Platform availability comes **from the signed entitlement** (N-09): the
 * server already cut its `features` down to what staff released to this
 * business, so a key switched on in the console lights up here on the next
 * pull, and one switched off goes dark. Only with no verified entitlement do
 * the compiled defaults stand in.
 */

import {
  DEFAULT_FEATURE_FLAGS,
  FALLBACK_PLAN,
  FEATURE_FLAG_KEYS,
  PLATFORM_AVAILABLE,
  parseFeatureFlags,
  resolveEffectiveFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@xangarro/domain';
import { useEntitlement } from '../entitlement/use-entitlement';
import { useCurrentBusiness } from './use-current-business';

function releasedFlags(features: readonly FeatureFlagKey[]): FeatureFlags {
  return Object.fromEntries(
    FEATURE_FLAG_KEYS.map((k) => [k, features.includes(k)]),
  ) as FeatureFlags;
}

export function useFeatureFlags(): FeatureFlags {
  const { data: business } = useCurrentBusiness();
  const entitlement = useEntitlement();
  const tenant = business ? parseFeatureFlags(business.featureFlags) : DEFAULT_FEATURE_FLAGS;
  const released = entitlement?.features ?? null;
  return resolveEffectiveFlags({
    platform: released === null ? PLATFORM_AVAILABLE : releasedFlags(released),
    plan: entitlement?.plan ?? FALLBACK_PLAN,
    tenant,
  });
}

/** Single flag convenience hook. */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}
