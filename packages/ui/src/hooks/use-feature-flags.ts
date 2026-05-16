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
  parseFeatureFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@cachink/domain';
import { useCurrentBusiness } from './use-current-business';

/** Parse and return all flags from the current business. */
export function useFeatureFlags(): FeatureFlags {
  const { data: business } = useCurrentBusiness();
  if (!business) return DEFAULT_FEATURE_FLAGS;
  return parseFeatureFlags(business.featureFlags);
}

/** Single flag convenience hook. */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}
