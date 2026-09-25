'use server';

import {
  AplicarConfiguracionUseCase,
  GuardarRespuestasUseCase,
  SolicitarPruebaUseCase,
  type BillingInterval,
  type TrialCheckout,
} from '@xangarro/application';
import {
  PLAN_IDS,
  parseWizardAnswers,
  type BusinessId,
  type PlanId,
  type WizardAnswers,
} from '@xangarro/domain';
import { getBusiness } from '@xangarro/data-pg';
import { revalidatePath } from 'next/cache';

import { allowedFor } from '@/onboarding/plan-copy';
import { reconcile, skipKeys } from '@/onboarding/wizard-steps';

import { failure, type Failure, type FailurePolicy } from '../action-errors';
import { requireMember } from '../auth';
import { betaNoCharge } from '../billing/beta';
import { portalOrigin } from '../billing/origin';
import { tenantEntitlement } from '../billing/plan';
import { withTenant, type Tx } from '../db';
import { recordGeo } from '../geo/record';
import { trialCheckoutFor } from '../onboarding/checkout';
import { pgOnboardingStore } from '../onboarding/store';
import { pgBusinessesRepository } from '../repositories/businesses';

/**
 * The wizard's writes (N-12 … N-15). Composition roots only: the rules are the
 * application use cases', the storage the Postgres ports'. Owner-only — the
 * answers reconfigure the business.
 */
export type OkOr<T> = ({ ok: true } & T) | Failure;

const FREE_PLAN: PlanId = PLAN_IDS[0];

/** The wizard's refusals; two in the wizard's words, since the domain's are written for logs. */
const REFUSALS: FailurePolicy = {
  shown: [
    'INVALID_WIZARD_ANSWERS',
    'CONTRADICTORY_WIZARD_ANSWERS',
    'NOT_A_PAID_PLAN',
    'BUSINESS_NOT_FOUND',
    'FLAG_NOT_ALLOWED',
    'FLAG_DEPENDENCY',
  ],
  copy: {
    INVALID_WIZARD_ANSWERS: 'Revisa tu respuesta: hay un dato que no pudimos guardar.',
    CONTRADICTORY_WIZARD_ANSWERS: 'Esa respuesta contradice otra anterior. Revísalas.',
  },
};

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
    return failure(error, 'guardarPaso', { ...REFUSALS, businessId });
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
    return failure(error, 'seguirGratis', { ...REFUSALS, businessId });
  }
}

/** N-15: apply a re-run against the plan the business is on (its subscription, B-10). */
export async function aplicarCambios(): Promise<OkOr<object>> {
  let businessId: BusinessId | undefined;
  try {
    const id = (businessId = await owner());
    await withTenant(id, async (tx) =>
      aplicar(tx, id, (await tenantEntitlement(tx, id, new Date())).plan, false),
    );
    revalidatePath('/negocio');
    return { ok: true };
  } catch (error) {
    return failure(error, 'aplicarCambios', { ...REFUSALS, businessId });
  }
}

/** During the beta (D-1) nothing is charged: the intent is kept, Checkout never opens. */
const noCheckout: TrialCheckout = {
  startTrialCheckout: () => Promise.resolve({ status: 'unavailable' as const }),
};

/**
 * [Contratar este plan], paid from day one (ADR-105): first apply what the wizard answered and the current (free)
 * plan allows — payment types, inventory, cash — so the business is configured
 * whichever way the tap ends (P-36.3: before this, only [Seguir gratis]
 * applied anything and a paid tap left Negocio at its defaults); the plan-gated
 * answers stay pending for the entitlement webhook. Then record the intent and
 * open B-10's Stripe Checkout (card collected, no trial), unless the beta keeps it closed.
 */
export async function probarGratis(
  plan: PlanId,
  interval: BillingInterval,
): Promise<OkOr<{ redirect: string | null; beta: boolean }>> {
  let businessId: BusinessId | undefined;
  try {
    const session = await requireMember('owner');
    const id = (businessId = session.business_id as BusinessId);
    const origin = await portalOrigin();
    const beta = betaNoCharge();
    const result = await withTenant(id, async (tx) => {
      await aplicar(tx, id, FREE_PLAN, false);
      const name = (await getBusiness(tx))?.nombre ?? 'Mi negocio';
      const checkout = beta
        ? noCheckout
        : trialCheckoutFor({ id, name, email: session.email }, origin);
      return new SolicitarPruebaUseCase(pgOnboardingStore(tx, id), checkout).execute({
        businessId: id,
        plan,
        interval,
      });
    });
    revalidatePath('/negocio');
    const redirect = result.status === 'redirect' ? result.url : null;
    // N-58: the buyer's region exists only here. The Stripe webhook is a
    // server-to-server call, so its IP is Stripe's, and Stripe's only
    // geographic fact would be the card issuer's country — never a Mexican
    // state. Counted at the redirect, so the metric means "checkout started",
    // which is what the console's label says.
    if (redirect !== null) await recordGeo('compra');
    return { ok: true, redirect, beta };
  } catch (error) {
    return failure(error, 'probarGratis', { ...REFUSALS, businessId });
  }
}
