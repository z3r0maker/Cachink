import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  WIZARD_STEP_KEYS,
  WizardAnswersSchema,
  answeredSteps,
} from '../../src/onboarding/index.js';

/**
 * Which answers belong to which of the eight steps (N-12). The wizard clears a
 * step's keys when it is skipped, and Synth's onboarding scenarios (S-10)
 * count the steps answered from the same list.
 */
describe('WIZARD_STEP_KEYS', () => {
  it('has eight steps that between them hold every answer exactly once', () => {
    assert.equal(WIZARD_STEP_KEYS.length, 8);
    const keys = WIZARD_STEP_KEYS.flat();
    assert.equal(new Set(keys).size, keys.length);
    assert.deepEqual([...keys].sort(), Object.keys(WizardAnswersSchema.shape).sort());
  });
});

describe('answeredSteps', () => {
  it('counts every step when each holds an answer', () => {
    assert.equal(
      answeredSteps({
        nombre: 'Abarrotes Lupita',
        metodosCobro: ['Efectivo'],
        manejaInventario: false,
        manejaCajaEfectivo: true,
        vendeACredito: true,
        hasLogo: false,
        tieneDatosFiscales: false,
        personasQueCobran: 1,
      }),
      8,
    );
  });

  it('counts none for a wizard skipped from start to end', () => {
    assert.equal(answeredSteps({}), 0);
  });

  it('counts a two-answer step once, however many of its answers are there', () => {
    assert.equal(answeredSteps({ nombre: 'Lupita', tipoNegocio: 'producto-con-stock' }), 1);
    assert.equal(answeredSteps({ whatsapp: '5512345678', hasLogo: true }), 1);
  });

  it('counts a «no» as an answer: false is an opinion, a skipped step is not', () => {
    assert.equal(answeredSteps({ manejaInventario: false, vendeACredito: false }), 2);
  });
});
