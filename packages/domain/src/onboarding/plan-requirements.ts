/**
 * What the wizard answers demand of a plan, and which plan satisfies them.
 *
 * Plans are never named here: satisfaction is read from `PLAN_LIMITS`, and
 * "cheapest" is the order of `PLAN_IDS` (ascending price, ADR-059). Moving a
 * feature between plans in `PLAN_LIMITS` moves the suggestion with it.
 */

import type { FeatureFlagKey } from '../entities/feature-flags.js';
import { PLAN_IDS, PLAN_LIMITS, type PlanId } from '../entities/plan.js';
import { wantsCredit, type WizardAnswerKey, type WizardAnswers } from './wizard-answers.js';

export type PlanRequirement =
  | { readonly kind: 'feature'; readonly key: FeatureFlagKey }
  | { readonly kind: 'operators'; readonly min: number };

/** Stable codes explaining a suggested plan; the UI owns the i18n. */
export const REASON_CODES = ['INVENTARIO', 'VENTAS_A_CREDITO', 'MAS_PERSONAS'] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export interface AnswerRequirement {
  readonly answer: WizardAnswerKey;
  readonly requirement: PlanRequirement;
  readonly reason: ReasonCode;
}

/** Requirements implied by the answers, in wizard-step order. */
export function requirementsFor(answers: WizardAnswers): AnswerRequirement[] {
  const out: AnswerRequirement[] = [];
  if (answers.manejaInventario === true) {
    out.push({
      answer: 'manejaInventario',
      requirement: { kind: 'feature', key: 'stock' },
      reason: 'INVENTARIO',
    });
  }
  if (wantsCredit(answers) === true) {
    out.push({
      answer: 'vendeACredito',
      requirement: { kind: 'feature', key: 'ventasCredito' },
      reason: 'VENTAS_A_CREDITO',
    });
  }
  if (answers.personasQueCobran !== undefined) {
    out.push({
      answer: 'personasQueCobran',
      requirement: { kind: 'operators', min: answers.personasQueCobran },
      reason: 'MAS_PERSONAS',
    });
  }
  return out;
}

/**
 * Each person who cobra needs an operator and a device slot. Devices are the
 * tighter of the two since ADR-106 (operators = devices + 1), so the
 * suggestion is the same as before the owner got a seat of his own.
 */
export function planSatisfies(plan: PlanId, requirement: PlanRequirement): boolean {
  const limits = PLAN_LIMITS[plan];
  if (requirement.kind === 'feature') return limits.features.includes(requirement.key);
  return limits.operators >= requirement.min && limits.devices >= requirement.min;
}

/** Cheapest plan meeting every requirement; the largest plan when none does. */
export function cheapestPlanFor(requirements: readonly PlanRequirement[]): PlanId {
  const [largest] = [...PLAN_IDS].reverse() as [PlanId];
  return PLAN_IDS.find((plan) => requirements.every((r) => planSatisfies(plan, r))) ?? largest;
}
