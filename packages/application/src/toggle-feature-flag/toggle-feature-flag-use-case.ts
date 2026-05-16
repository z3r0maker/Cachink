/**
 * ToggleFeatureFlagUseCase — toggles a business feature flag.
 *
 * Validates dependencies (canEnableFlag) and applies cascade when
 * disabling. Persists the resolved flags to the business record.
 *
 * Phase 3 of the Feature Flags plan.
 */

import {
  canEnableFlag,
  resolveDisableCascade,
  parseFeatureFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@cachink/domain';
import type { BusinessId } from '@cachink/domain';
import type { BusinessesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface ToggleFeatureFlagInput {
  readonly businessId: BusinessId;
  readonly flagKey: FeatureFlagKey;
  readonly newValue: boolean;
}

export class ToggleFeatureFlagUseCase
  implements UseCase<ToggleFeatureFlagInput, FeatureFlags>
{
  readonly #businesses: BusinessesRepository;

  constructor(businesses: BusinessesRepository) {
    this.#businesses = businesses;
  }

  async execute(
    input: ToggleFeatureFlagInput,
  ): Promise<FeatureFlags> {
    const business = await this.#businesses.findById(
      input.businessId,
    );
    if (!business) {
      throw new TypeError('Negocio no encontrado');
    }

    const current = parseFeatureFlags(business.featureFlags);

    let resolved: FeatureFlags;
    if (input.newValue) {
      if (!canEnableFlag(current, input.flagKey)) {
        throw new TypeError(
          `No se puede activar ${input.flagKey}: dependencia no activa`,
        );
      }
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
