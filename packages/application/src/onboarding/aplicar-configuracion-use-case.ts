/**
 * AplicarConfiguracionUseCase — turns the stored wizard answers into the
 * tenant's configuration (N-13 [Seguir gratis], N-15 re-run).
 *
 * The mapping is the domain's (`answersToConfiguration`, `applyConfiguration`,
 * `diffConfiguration`); this only reads, clamps to what the platform has
 * released, and writes through the existing paths: each feature switch goes
 * through `ToggleFeatureFlagUseCase` (dependencies and cascades), payment
 * methods and the name through `BusinessesRepository.update`. Answers the plan
 * cannot honour are kept as pending for the subscription webhook.
 *
 * `dryRun` returns the "esto cambiará" list without writing. No change means
 * no business write at all (N-15: applying twice is a no-op).
 */

import {
  BusinessNotFoundError,
  answersToConfiguration,
  applyConfiguration,
  diffConfiguration,
  parseWizardAnswers,
  type Business,
  type BusinessId,
  type ConfigurationChange,
  type FeatureFlagKey,
  type PendingPaidAnswer,
  type PlanId,
  type ReasonCode,
  type TenantConfiguration,
} from '@xangarro/domain';
import type { BusinessPatch, BusinessesRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';
import { ToggleFeatureFlagUseCase } from '../toggle-feature-flag/index.js';
import { clampToAllowed, currentConfiguration } from './configuracion-actual.js';
import type { OnboardingStore } from './ports.js';

export interface AplicarConfiguracionInput {
  readonly businessId: BusinessId;
  /** The plan the tenant is on now — what may be enabled. */
  readonly plan: PlanId;
  /** Keys that may be turned on: platform ∩ plan (as P-15's switches). */
  readonly allowed: ReadonlySet<FeatureFlagKey>;
  readonly dryRun?: boolean;
}

export interface AplicarConfiguracionResult {
  readonly changes: readonly ConfigurationChange[];
  readonly suggestedPlan: PlanId;
  readonly reasons: readonly ReasonCode[];
  readonly pendingPaidAnswers: readonly PendingPaidAnswer[];
}

export class AplicarConfiguracionUseCase implements UseCase<
  AplicarConfiguracionInput,
  AplicarConfiguracionResult
> {
  readonly #businesses: BusinessesRepository;
  readonly #store: OnboardingStore;

  constructor(businesses: BusinessesRepository, store: OnboardingStore) {
    this.#businesses = businesses;
    this.#store = store;
  }

  async execute(input: AplicarConfiguracionInput): Promise<AplicarConfiguracionResult> {
    const business = await this.#businesses.findById(input.businessId);
    if (!business) throw new BusinessNotFoundError();
    const record = await this.#store.find();
    const answers = parseWizardAnswers(record?.answers ?? {});
    const config = answersToConfiguration(answers, input.plan);
    const current = currentConfiguration(business);
    const next = clampToAllowed(current, applyConfiguration(current, config), input.allowed);
    const changes = diffConfiguration(current, next);
    const result = {
      changes,
      suggestedPlan: config.suggestedPlan,
      reasons: config.reasons,
      pendingPaidAnswers: config.pendingPaidAnswers,
    };
    if (input.dryRun === true) return result;

    await this.#writeFeatures(input, changes);
    await this.#writeBusiness(business, next, changes, answers.nombre);
    await this.#store.complete(config.pendingPaidAnswers, new Date().toISOString());
    return result;
  }

  async #writeFeatures(
    input: AplicarConfiguracionInput,
    changes: readonly ConfigurationChange[],
  ): Promise<void> {
    const toggle = new ToggleFeatureFlagUseCase(this.#businesses);
    for (const change of changes) {
      if (change.kind !== 'feature') continue;
      await toggle.execute({
        businessId: input.businessId,
        flagKey: change.key,
        newValue: change.enabled,
        allowed: input.allowed,
      });
    }
  }

  async #writeBusiness(
    business: Business,
    next: TenantConfiguration,
    changes: readonly ConfigurationChange[],
    nombre: string | undefined,
  ): Promise<void> {
    const patch: { -readonly [K in keyof BusinessPatch]: BusinessPatch[K] } = {};
    if (changes.some((c) => c.kind === 'paymentType') && next.paymentTypes.length > 0) {
      patch.enabledPaymentMethods = JSON.stringify(next.paymentTypes);
    }
    if (nombre !== undefined && nombre !== business.nombre) patch.nombre = nombre;
    if (Object.keys(patch).length > 0) await this.#businesses.update(business.id, patch);
  }
}
