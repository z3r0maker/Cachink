/**
 * Table-driven: every combination of the answers that can move the suggested
 * plan (N-12 acceptance). The expectation is written as the business states it
 * — inventory, credit or a 2nd cashier need Xangarro; 3–5 cashiers (or more)
 * need Xangarrote — so a change to PLAN_LIMITS that moves a plan shows up here.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { answersToConfiguration, type WizardAnswers } from '../../src/onboarding/index.js';
import { PLAN_IDS, type PlanId } from '../../src/entities/plan.js';

type Tri = boolean | undefined;
const TRI: readonly Tri[] = [undefined, false, true];
const CREDIT_SOURCES = ['skip', 'no', 'yes', 'metodo'] as const;
const PERSONAS: readonly (number | undefined)[] = [undefined, 1, 2, 3, 5, 6];

function creditAnswers(source: (typeof CREDIT_SOURCES)[number]): WizardAnswers {
  if (source === 'no') return { vendeACredito: false };
  if (source === 'yes') return { vendeACredito: true };
  if (source === 'metodo') return { metodosCobro: ['Efectivo', 'Crédito'] };
  return {};
}

function expected(inventory: Tri, credit: string, personas: number | undefined): PlanId {
  if (personas !== undefined && personas > 2) return 'xangarrote';
  const wantsCredit = credit === 'yes' || credit === 'metodo';
  if (inventory === true || wantsCredit || personas === 2) return 'xangarro';
  return 'xangarrito';
}

const cases = TRI.flatMap((inventory) =>
  CREDIT_SOURCES.flatMap((credit) =>
    PERSONAS.map((personas) => ({ inventory, credit, personas })),
  ),
);

describe('suggested plan — every combination', () => {
  it.each(cases)(
    'inventario=$inventory crédito=$credit personas=$personas',
    ({ inventory, credit, personas }) => {
      const answers: WizardAnswers = {
        ...creditAnswers(credit),
        ...(inventory === undefined ? {} : { manejaInventario: inventory }),
        ...(personas === undefined ? {} : { personasQueCobran: personas }),
      };
      const want = expected(inventory, credit, personas);
      for (const current of PLAN_IDS) {
        const result = answersToConfiguration(answers, current);
        assert.equal(result.suggestedPlan, want);
        assert.equal(result.reasons.length === 0, want === 'xangarrito');
      }
    },
  );

  it('covers all 72 combinations', () => {
    assert.equal(cases.length, 72);
  });
});
