/**
 * ToggleFeatureFlagUseCase — toggles a business feature flag.
 *
 * Validates dependencies (canEnableFlag) and applies cascade when
 * disabling. Persists the resolved flags to the business record.
 *
 * Phase 3 of the Feature Flags plan.
 */

import {
  BusinessNotFoundError,
  canEnableFlag,
  FlagDependencyError,
  FlagNotAllowedError,
  resolveDisableCascade,
  parseFeatureFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@xangarro/domain';
import type { BusinessId } from '@xangarro/domain';
import type { BusinessesRepository } from '@xangarro/data';
import type { UseCase } from '../_use-case.js';

export interface ToggleFeatureFlagInput {
  readonly businessId: BusinessId;
  readonly flagKey: FeatureFlagKey;
  readonly newValue: boolean;
  /**
   * Keys this caller may turn **on** — the portal passes platform ∩ plan
   * (P-15), so a dark or unpaid feature is refused server-side and not only
   * hidden. Omitted, anything the dependencies allow may be enabled. Turning a
   * flag off is always allowed.
   */
  readonly allowed?: ReadonlySet<FeatureFlagKey>;
}

export class ToggleFeatureFlagUseCase implements UseCase<ToggleFeatureFlagInput, FeatureFlags> {
  readonly #businesses: BusinessesRepository;

  constructor(businesses: BusinessesRepository) {
    this.#businesses = businesses;
  }

  async execute(input: ToggleFeatureFlagInput): Promise<FeatureFlags> {
    const business = await this.#businesses.findById(input.businessId);
    if (!business) throw new BusinessNotFoundError();

    const current = parseFeatureFlags(business.featureFlags);

    let resolved: FeatureFlags;
    if (input.newValue) {
      if (input.allowed !== undefined && !input.allowed.has(input.flagKey)) {
        throw new FlagNotAllowedError(input.flagKey);
      }
      if (!canEnableFlag(current, input.flagKey)) throw new FlagDependencyError(input.flagKey);
      resolved = { ...current, [input.flagKey]: true };
    } else {
      resolved = resolveDisableCascade(current, input.flagKey);
    }

    await this.#businesses.update(input.businessId, {
      featureFlags: JSON.stringify(resolved),
    });

    return resolved;
  }
}
