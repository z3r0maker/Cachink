import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { OnboardingError, parseWizardAnswers } from '../../src/onboarding/index.js';

function expectOnboardingError(fn: () => unknown, code: OnboardingError['code']): OnboardingError {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof OnboardingError);
    assert.equal(error.code, code);
    return error;
  }
  assert.fail('expected an OnboardingError');
}

describe('parseWizardAnswers', () => {
  it('accepts a fully answered wizard and trims the name', () => {
    const answers = parseWizardAnswers({
      nombre: '  Taquería Don Pepe ',
      tipoNegocio: 'producto-con-stock',
      metodosCobro: ['Efectivo', 'Tarjeta'],
      manejaInventario: true,
      manejaCajaEfectivo: true,
      vendeACredito: false,
      whatsapp: '+525512345678',
      hasLogo: true,
      tieneDatosFiscales: false,
      personasQueCobran: 2,
    });
    assert.equal(answers.nombre, 'Taquería Don Pepe');
    assert.deepEqual(answers.metodosCobro, ['Efectivo', 'Tarjeta']);
    assert.equal(answers.personasQueCobran, 2);
  });

  it('accepts an empty object — every step is skippable', () => {
    assert.deepEqual(parseWizardAnswers({}), {});
  });

  it('rejects a non-object with INVALID_WIZARD_ANSWERS', () => {
    expectOnboardingError(() => parseWizardAnswers('hola'), 'INVALID_WIZARD_ANSWERS');
    expectOnboardingError(() => parseWizardAnswers(null), 'INVALID_WIZARD_ANSWERS');
  });

  it('rejects unknown keys so typos never pass silently', () => {
    const err = expectOnboardingError(
      () => parseWizardAnswers({ manejaInventraio: true }),
      'INVALID_WIZARD_ANSWERS',
    );
    assert.ok(err.issues.length > 0);
  });

  it('rejects personasQueCobran below 1 or fractional', () => {
    expectOnboardingError(
      () => parseWizardAnswers({ personasQueCobran: 0 }),
      'INVALID_WIZARD_ANSWERS',
    );
    expectOnboardingError(
      () => parseWizardAnswers({ personasQueCobran: 1.5 }),
      'INVALID_WIZARD_ANSWERS',
    );
  });

  it('rejects an empty, duplicated or unknown payment method list', () => {
    expectOnboardingError(() => parseWizardAnswers({ metodosCobro: [] }), 'INVALID_WIZARD_ANSWERS');
    expectOnboardingError(
      () => parseWizardAnswers({ metodosCobro: ['Efectivo', 'Efectivo'] }),
      'INVALID_WIZARD_ANSWERS',
    );
    expectOnboardingError(
      () => parseWizardAnswers({ metodosCobro: ['Bitcoin'] }),
      'INVALID_WIZARD_ANSWERS',
    );
  });

  it('rejects a blank name, an unknown tipo de negocio and a malformed WhatsApp', () => {
    expectOnboardingError(() => parseWizardAnswers({ nombre: '   ' }), 'INVALID_WIZARD_ANSWERS');
    expectOnboardingError(
      () => parseWizardAnswers({ tipoNegocio: 'fábrica' }),
      'INVALID_WIZARD_ANSWERS',
    );
    expectOnboardingError(
      () => parseWizardAnswers({ whatsapp: '55-1234' }),
      'INVALID_WIZARD_ANSWERS',
    );
  });

  it('rejects "no vendo a crédito" together with Crédito as a payment method', () => {
    expectOnboardingError(
      () => parseWizardAnswers({ metodosCobro: ['Crédito'], vendeACredito: false }),
      'CONTRADICTORY_WIZARD_ANSWERS',
    );
  });
});
