import 'server-only';

import { AplicarConfiguracionUseCase } from '@xangarro/application';
import type { BusinessId, ConfigurationChange } from '@xangarro/domain';

import { PLAN_FIXTURE } from '@/fixtures/business';
import { allowedFor } from '@/onboarding/plan-copy';

import { withTenant } from '../db';
import { pgBusinessesRepository } from '../repositories/businesses';
import { pgOnboardingStore } from './store';

/**
 * N-15's "esto cambiará": the use case in `dryRun`, so the list shown is
 * computed by exactly the code that will apply it — nothing is written.
 */
export function previewChanges(businessId: BusinessId): Promise<readonly ConfigurationChange[]> {
  const plan = PLAN_FIXTURE.planId;
  return withTenant(businessId, async (tx) => {
    const useCase = new AplicarConfiguracionUseCase(
      pgBusinessesRepository(tx, businessId),
      pgOnboardingStore(tx, businessId),
    );
    const result = await useCase.execute({
      businessId,
      plan,
      allowed: allowedFor(plan),
      dryRun: true,
    });
    return result.changes;
  });
}
