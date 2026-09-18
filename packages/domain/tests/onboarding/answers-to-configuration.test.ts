import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { OnboardingError, answersToConfiguration } from '../../src/onboarding/index.js';
import type { PlanId } from '../../src/entities/plan.js';

describe('answersToConfiguration — happy paths', () => {
  it('inventory + credit on a paid plan enables both and suggests xangarro with reasons', () => {
    const result = answersToConfiguration(
      { manejaInventario: true, vendeACredito: true, metodosCobro: ['Efectivo', 'Tarjeta'] },
      'xangarro',
    );
    assert.deepEqual(result.toggles, { stock: true, ventasCredito: true });
    assert.deepEqual(result.paymentTypes, {
      set: ['Efectivo', 'Tarjeta', 'Crédito'],
      add: [],
      remove: [],
    });
    assert.equal(result.suggestedPlan, 'xangarro');
    assert.deepEqual(result.reasons, ['INVENTARIO', 'VENTAS_A_CREDITO']);
    assert.deepEqual(result.pendingPaidAnswers, []);
  });

  it('skipped-everything input → free plan, no reasons, no changes', () => {
    const result = answersToConfiguration({}, 'xangarrito');
    assert.equal(result.suggestedPlan, 'xangarrito');
    assert.deepEqual(result.reasons, []);
    assert.deepEqual(result.toggles, {});
    assert.deepEqual(result.paymentTypes, { set: null, add: [], remove: [] });
    assert.deepEqual(result.pendingPaidAnswers, []);
  });

  it('answers with no plan impact (name, WhatsApp, logo, fiscal) keep the free plan', () => {
    const result = answersToConfiguration(
      {
        nombre: 'Estética Luz',
        tipoNegocio: 'servicio',
        whatsapp: '5512345678',
        hasLogo: true,
        tieneDatosFiscales: true,
        personasQueCobran: 1,
      },
      'xangarrito',
    );
    assert.equal(result.suggestedPlan, 'xangarrito');
    assert.deepEqual(result.reasons, []);
  });
});

describe('answersToConfiguration — paid answers on a plan that lacks them', () => {
  it('parks inventory and credit as pending and does NOT enable them', () => {
    const result = answersToConfiguration(
      { manejaInventario: true, metodosCobro: ['Efectivo', 'Crédito'] },
      'xangarrito',
    );
    assert.deepEqual(result.toggles, {});
    assert.deepEqual(result.paymentTypes.set, ['Efectivo']);
    assert.deepEqual(result.pendingPaidAnswers, [
      { answer: 'manejaInventario', includedIn: 'xangarro' },
      { answer: 'vendeACredito', includedIn: 'xangarro' },
    ]);
    assert.equal(result.suggestedPlan, 'xangarro');
  });

  it('parks more cashiers than the plan allows, naming the cheapest plan that fits', () => {
    const result = answersToConfiguration({ personasQueCobran: 4 }, 'xangarro');
    assert.deepEqual(result.pendingPaidAnswers, [
      { answer: 'personasQueCobran', includedIn: 'xangarrote' },
    ]);
    assert.deepEqual(result.reasons, ['MAS_PERSONAS']);
  });

  it('more cashiers than any plan allows suggests the largest plan', () => {
    const result = answersToConfiguration({ personasQueCobran: 12 }, 'xangarrote');
    assert.equal(result.suggestedPlan, 'xangarrote');
    assert.deepEqual(result.pendingPaidAnswers, [
      { answer: 'personasQueCobran', includedIn: 'xangarrote' },
    ]);
  });
});

describe('answersToConfiguration — "no" answers and deltas', () => {
  it('"no manejo inventario" turns stock and every stock dependent off', () => {
    const result = answersToConfiguration({ manejaInventario: false }, 'xangarrote');
    assert.deepEqual(result.toggles, {
      stock: false,
      conversionMateriaPrima: false,
      conversionAutomatica: false,
      auditoriaInventario: false,
      merma: false,
    });
    assert.equal(result.suggestedPlan, 'xangarrito');
  });

  it('credit and caja answers without step 2 become add/remove deltas', () => {
    const on = answersToConfiguration(
      { vendeACredito: true, manejaCajaEfectivo: true },
      'xangarro',
    );
    assert.deepEqual(on.paymentTypes, { set: null, add: ['Efectivo', 'Crédito'], remove: [] });
    const off = answersToConfiguration({ vendeACredito: false }, 'xangarro');
    assert.deepEqual(off.toggles, { ventasCredito: false });
    assert.deepEqual(off.paymentTypes, { set: null, add: [], remove: ['Crédito'] });
  });

  it('caja de efectivo adds Efectivo to an answered list in canonical order', () => {
    const result = answersToConfiguration(
      { metodosCobro: ['QR/CoDi', 'Tarjeta'], manejaCajaEfectivo: true },
      'xangarrito',
    );
    assert.deepEqual(result.paymentTypes.set, ['Efectivo', 'Tarjeta', 'QR/CoDi']);
  });
});

describe('answersToConfiguration — invalid input', () => {
  it('throws UNKNOWN_PLAN for a plan id outside PLAN_IDS', () => {
    assert.throws(
      () => answersToConfiguration({}, 'enterprise' as PlanId),
      (e: unknown) => e instanceof OnboardingError && e.code === 'UNKNOWN_PLAN',
    );
  });

  it('throws INVALID_WIZARD_ANSWERS for malformed answers', () => {
    assert.throws(
      () => answersToConfiguration({ personasQueCobran: -1 }, 'xangarrito'),
      (e: unknown) => e instanceof OnboardingError && e.code === 'INVALID_WIZARD_ANSWERS',
    );
  });

  it('throws CONTRADICTORY_WIZARD_ANSWERS for Crédito + "no vendo a crédito"', () => {
    assert.throws(
      () => answersToConfiguration({ metodosCobro: ['Crédito'], vendeACredito: false }, 'xangarro'),
      (e: unknown) => e instanceof OnboardingError && e.code === 'CONTRADICTORY_WIZARD_ANSWERS',
    );
  });
});
