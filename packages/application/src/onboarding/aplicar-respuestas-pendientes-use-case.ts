/**
 * AplicarRespuestasPendientesUseCase — the subscription webhook's half of
 * N-13 (B-10's `EntitlementListener`).
 *
 * [Seguir gratis] keeps the answers the free plan cannot honour as pending.
 * When a billing event leaves the business on a plan that covers at least one
 * of them, the wizard is applied again against that plan through
 * `AplicarConfiguracionUseCase` (idempotent), which also stores whatever is
 * still pending. Anything else — no wizard applied, nothing pending, a plan
 * that still falls short — is a no-op, so renewals and downgrades never
 * re-apply the wizard over the owner's later changes.
 */

import { PLAN_IDS, type PendingPaidAnswer, type PlanId } from '@xangarro/domain';
import type { BusinessesRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';
import {
  AplicarConfiguracionUseCase,
  type AplicarConfiguracionInput,
  type AplicarConfiguracionResult,
} from './aplicar-configuracion-use-case.js';
import type { OnboardingStore } from './ports.js';

export type AplicarRespuestasPendientesInput = Omit<AplicarConfiguracionInput, 'dryRun'>;

/** Plans are ordered by price (ADR-059): a plan covers what a cheaper one includes. */
function covers(plan: PlanId, pending: PendingPaidAnswer): boolean {
  return PLAN_IDS.indexOf(plan) >= PLAN_IDS.indexOf(pending.includedIn);
}

export class AplicarRespuestasPendientesUseCase implements UseCase<
  AplicarRespuestasPendientesInput,
  AplicarConfiguracionResult | null
> {
  readonly #businesses: BusinessesRepository;
  readonly #store: OnboardingStore;

  constructor(businesses: BusinessesRepository, store: OnboardingStore) {
    this.#businesses = businesses;
    this.#store = store;
  }

  async execute(
    input: AplicarRespuestasPendientesInput,
  ): Promise<AplicarConfiguracionResult | null> {
    const record = await this.#store.find();
    if (record === null || record.completedAt === null) return null;
    if (!record.pendingPaidAnswers.some((p) => covers(input.plan, p))) return null;
    return new AplicarConfiguracionUseCase(this.#businesses, this.#store).execute(input);
  }
}
