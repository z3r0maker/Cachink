import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  answersToConfiguration,
  applyConfiguration,
  diffConfiguration,
  type TenantConfiguration,
} from '../../src/onboarding/index.js';
import { DEFAULT_FEATURE_FLAGS } from '../../src/entities/feature-flags.js';

const CURRENT: TenantConfiguration = {
  toggles: { ...DEFAULT_FEATURE_FLAGS },
  paymentTypes: ['Efectivo', 'Transferencia', 'Tarjeta'],
};

const clone = (c: TenantConfiguration): TenantConfiguration => ({
  toggles: { ...c.toggles },
  paymentTypes: [...c.paymentTypes],
});

describe('diffConfiguration', () => {
  it('lists every feature and payment-type change in a stable order', () => {
    const next: TenantConfiguration = {
      toggles: { ...DEFAULT_FEATURE_FLAGS, stock: false, ventasCredito: true },
      paymentTypes: ['Efectivo', 'Crédito'],
    };
    assert.deepEqual(diffConfiguration(CURRENT, next), [
      { kind: 'feature', key: 'stock', enabled: false },
      { kind: 'feature', key: 'ventasCredito', enabled: true },
      { kind: 'paymentType', method: 'Transferencia', enabled: false },
      { kind: 'paymentType', method: 'Tarjeta', enabled: false },
      { kind: 'paymentType', method: 'Crédito', enabled: true },
    ]);
  });

  it('identical configurations are a no-op', () => {
    assert.deepEqual(diffConfiguration(CURRENT, clone(CURRENT)), []);
  });

  it('payment types are a set: order and duplicates are not changes', () => {
    const next: TenantConfiguration = {
      toggles: { ...DEFAULT_FEATURE_FLAGS },
      paymentTypes: ['Tarjeta', 'Efectivo', 'Transferencia', 'Efectivo'],
    };
    assert.deepEqual(diffConfiguration(CURRENT, next), []);
  });

  it('emptying every payment type lists each removal', () => {
    const next: TenantConfiguration = { ...CURRENT, paymentTypes: [] };
    assert.equal(diffConfiguration(CURRENT, next).length, 3);
  });
});

describe('applyConfiguration', () => {
  it('re-running the wizard with the current answers changes nothing', () => {
    const result = answersToConfiguration(
      {
        manejaInventario: true,
        vendeACredito: false,
        metodosCobro: ['Efectivo', 'Transferencia', 'Tarjeta'],
      },
      'xangarro',
    );
    const next = applyConfiguration(CURRENT, result);
    assert.deepEqual(diffConfiguration(CURRENT, next), []);
  });

  it('skipped wizard leaves the configuration untouched', () => {
    const next = applyConfiguration(CURRENT, answersToConfiguration({}, 'xangarrito'));
    assert.deepEqual(next, CURRENT);
  });

  it('applies add/remove deltas when step 2 was skipped', () => {
    const withCredit = { ...CURRENT, paymentTypes: [...CURRENT.paymentTypes, 'Crédito' as const] };
    const result = answersToConfiguration({ vendeACredito: false }, 'xangarro');
    const next = applyConfiguration(withCredit, result);
    assert.deepEqual(next.paymentTypes, ['Efectivo', 'Transferencia', 'Tarjeta']);
    assert.equal(next.toggles.ventasCredito, false);
  });

  it('does not mutate the current configuration', () => {
    const snapshot = clone(CURRENT);
    applyConfiguration(CURRENT, answersToConfiguration({ manejaInventario: false }, 'xangarro'));
    assert.deepEqual(CURRENT, snapshot);
  });

  it('turning inventory off surfaces "se desactivará Inventario" in the diff', () => {
    const next = applyConfiguration(
      CURRENT,
      answersToConfiguration({ manejaInventario: false }, 'xangarro'),
    );
    assert.deepEqual(diffConfiguration(CURRENT, next), [
      { kind: 'feature', key: 'stock', enabled: false },
    ]);
  });
});
