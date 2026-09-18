'use server';

import {
  AplicarConfiguracionUseCase,
  GuardarRespuestasUseCase,
  SolicitarPruebaUseCase,
  type BillingInterval,
} from '@xangarro/application';
import {
  PLAN_IDS,
  parseWizardAnswers,
  type BusinessId,
  type PlanId,
  type WizardAnswers,
} from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { PLAN_FIXTURE } from '@/fixtures/business';
import { allowedFor } from '@/onboarding/plan-copy';
import { reconcile, skipKeys } from '@/onboarding/wizard-steps';

import { requireMember } from '../auth';
import { withTenant, type Tx } from '../db';
import { trialCheckout } from '../onboarding/checkout';
import { failure, type Failure } from '../onboarding/errors';
import { pgOnboardingStore } from '../onboarding/store';
import { pgBusinessesRepository } from '../repositories/businesses';

/**
 * The wizard's writes (N-12 … N-15). Composition roots only: the rules are the
 * application use cases', the storage the Postgres ports'. Owner-only — the
 * answers reconfigure the business.
 */
export type OkOr<T> = ({ ok: true } & T) | Failure;

const FREE_PLAN: PlanId = PLAN_IDS[0];

async function owner(): Promise<BusinessId> {
  return (await requireMember('owner')).business_id as BusinessId;
}

/** Save one step; `skip` clears it. Contradictions are reconciled, not refused. */
export async function guardarPaso(
  step: number,
  patch: WizardAnswers,
  skip: boolean,
): Promise<OkOr<{ answers: WizardAnswers }>> {
  let businessId: BusinessId | undefined;
  try {
    businessId = await owner();
    const id = businessId;
    const answers = await withTenant(id, async (tx) => {
      const store = pgOnboardingStore(tx, id);
      const stored = parseWizardAnswers((await store.find())?.answers ?? {});
      const save = skip ? { patch: {}, clear: skipKeys(step) } : reconcile(stored, patch);
      return new GuardarRespuestasUseCase(store).execute(save);
    });
    return { ok: true, answers };
  } catch (error) {
    return failure(error, 'guardarPaso', businessId);
  }
}

function aplicar(tx: Tx, businessId: BusinessId, plan: PlanId, dryRun: boolean) {
  const useCase = new AplicarConfiguracionUseCase(
    pgBusinessesRepository(tx, businessId),
    pgOnboardingStore(tx, businessId),
  );
  return useCase.execute({ businessId, plan, allowed: allowedFor(plan), dryRun });
}

/** [Seguir gratis]: configure for the free plan; paid-only answers stay pending. */
export async function seguirGratis(): Promise<OkOr<object>> {
  let businessId: BusinessId | undefined;
  try {
    const id = (businessId = await owner());
    await withTenant(id, (tx) => aplicar(tx, id, FREE_PLAN, false));
    revalidatePath('/negocio');
    return { ok: true };
  } catch (error) {
    return failure(error, 'seguirGratis', businessId);
  }
}

/**
 * N-15: apply a re-run against the plan the business is on. The plan is still
 * the fixture's until B-06 issues real entitlements — the same seam
 * `cambiarFuncion` reads.
 */
export async function aplicarCambios(): Promise<OkOr<object>> {
  let businessId: BusinessId | undefined;
  try {
    const id = (businessId = await owner());
    await withTenant(id, (tx) => aplicar(tx, id, PLAN_FIXTURE.planId, false));
    revalidatePath('/negocio');
    return { ok: true };
  } catch (error) {
    return failure(error, 'aplicarCambios', businessId);
  }
}

/** [Probar 14 días]: record the intent; Checkout is B-10's (stubbed `unavailable`). */
export async function probarGratis(
  plan: PlanId,
  interval: BillingInterval,
): Promise<OkOr<{ redirect: string | null }>> {
  let businessId: BusinessId | undefined;
  try {
    const id = (businessId = await owner());
    const result = await withTenant(id, (tx) =>
      new SolicitarPruebaUseCase(pgOnboardingStore(tx, id), trialCheckout).execute({
        businessId: id,
        plan,
        interval,
      }),
    );
    return { ok: true, redirect: result.status === 'redirect' ? result.url : null };
  } catch (error) {
    return failure(error, 'probarGratis', businessId);
  }
}
