/**
 * `answersToConfiguration` — the pure heart of "Platícanos de ti" (N-12).
 *
 * Turns wizard answers into tenant configuration for the plan the tenant is
 * on now, plus the plan that would fit them. Answers the current plan cannot
 * honour are NOT enabled: they come back in `pendingPaidAnswers` so the
 * subscription webhook can apply them on upgrade (N-13, ADR-067).
 */

import {
  FEATURE_FLAG_DEPENDENCIES,
  FEATURE_FLAG_KEYS,
  type FeatureFlagKey,
  type FeatureFlags,
} from '../entities/feature-flags.js';
import { PLAN_IDS, PlanIdSchema, type PlanId } from '../entities/plan.js';
import { PaymentMethodEnum, type PaymentMethod } from '../entities/sale.js';
import { OnboardingError } from './errors.js';
import {
  cheapestPlanFor,
  planSatisfies,
  requirementsFor,
  type ReasonCode,
} from './plan-requirements.js';
import {
  parseWizardAnswers,
  wantsCredit,
  type WizardAnswerKey,
  type WizardAnswers,
} from './wizard-answers.js';

/**
 * `set` replaces the list when step 2 was answered; otherwise `add`/`remove`
 * adjust whatever the tenant has. Every list is in `PaymentMethodEnum` order.
 */
export interface PaymentTypesPatch {
  readonly set: readonly PaymentMethod[] | null;
  readonly add: readonly PaymentMethod[];
  readonly remove: readonly PaymentMethod[];
}

export interface PendingPaidAnswer {
  readonly answer: WizardAnswerKey;
  /** Cheapest plan that includes what this answer needs (for the badge). */
  readonly includedIn: PlanId;
}

export interface WizardConfiguration {
  /** Only the flags the answers have an opinion on. */
  readonly toggles: Partial<FeatureFlags>;
  readonly paymentTypes: PaymentTypesPatch;
  readonly suggestedPlan: PlanId;
  /** Why `suggestedPlan` is above the free plan; empty when it is the free plan. */
  readonly reasons: readonly ReasonCode[];
  readonly pendingPaidAnswers: readonly PendingPaidAnswer[];
}

export function canonicalPaymentTypes(methods: Iterable<PaymentMethod>): PaymentMethod[] {
  const wanted = new Set(methods);
  return PaymentMethodEnum.options.filter((m) => wanted.has(m));
}

/** `key` and every flag that transitively depends on it. */
function withDependents(key: FeatureFlagKey): FeatureFlagKey[] {
  const dependsOn = (child: FeatureFlagKey): boolean => {
    const parent = FEATURE_FLAG_DEPENDENCIES[child];
    return parent !== undefined && (parent === key || dependsOn(parent));
  };
  return FEATURE_FLAG_KEYS.filter((k) => k === key || dependsOn(k));
}

function buildToggles(answers: WizardAnswers, allowed: (k: FeatureFlagKey) => boolean) {
  const toggles: Partial<Record<FeatureFlagKey, boolean>> = {};
  const opinions: [FeatureFlagKey, boolean | undefined][] = [
    ['stock', answers.manejaInventario],
    ['ventasCredito', wantsCredit(answers)],
  ];
  for (const [key, wanted] of opinions) {
    if (wanted === false) for (const k of withDependents(key)) toggles[k] = false;
    if (wanted === true && allowed(key)) toggles[key] = true;
  }
  return toggles;
}

function buildPaymentTypes(answers: WizardAnswers, creditAllowed: boolean): PaymentTypesPatch {
  const add = new Set<PaymentMethod>();
  const remove = new Set<PaymentMethod>();
  if (answers.manejaCajaEfectivo === true) add.add('Efectivo');
  const credit = wantsCredit(answers);
  if (credit === true && creditAllowed) add.add('Crédito');
  if (credit === false || (credit === true && !creditAllowed)) remove.add('Crédito');
  if (answers.metodosCobro === undefined) {
    return { set: null, add: canonicalPaymentTypes(add), remove: canonicalPaymentTypes(remove) };
  }
  const set = new Set([...answers.metodosCobro, ...add]);
  for (const m of remove) set.delete(m);
  return { set: canonicalPaymentTypes(set), add: [], remove: [] };
}

export function answersToConfiguration(
  rawAnswers: WizardAnswers,
  currentPlan: PlanId,
): WizardConfiguration {
  if (!PlanIdSchema.safeParse(currentPlan).success) {
    throw new OnboardingError('UNKNOWN_PLAN', `Plan desconocido: ${String(currentPlan)}`);
  }
  const answers = parseWizardAnswers(rawAnswers);
  const needs = requirementsFor(answers);
  const freePlan = PLAN_IDS[0];
  const allowed = (key: FeatureFlagKey) => planSatisfies(currentPlan, { kind: 'feature', key });
  return {
    toggles: buildToggles(answers, allowed),
    paymentTypes: buildPaymentTypes(answers, allowed('ventasCredito')),
    suggestedPlan: cheapestPlanFor(needs.map((n) => n.requirement)),
    reasons: needs.filter((n) => !planSatisfies(freePlan, n.requirement)).map((n) => n.reason),
    pendingPaidAnswers: needs
      .filter((n) => !planSatisfies(currentPlan, n.requirement))
      .map((n) => ({ answer: n.answer, includedIn: cheapestPlanFor([n.requirement]) })),
  };
}
