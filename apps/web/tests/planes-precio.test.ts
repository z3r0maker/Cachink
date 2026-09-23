import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { precioDePlan } from '../src/data/planes';

/** N-01: the card price is the catalogue's subtotal, «+ IVA», per interval. */
describe('precioDePlan', () => {
  it('shows the monthly subtotal plus IVA', () => {
    assert.deepEqual(precioDePlan('xangarro', 'month'), {
      price: '199',
      period: 'MXN / mes + IVA',
    });
    assert.deepEqual(precioDePlan('xangarrote', 'month'), {
      price: '399',
      period: 'MXN / mes + IVA',
    });
  });

  it('shows the annual subtotal, two months free', () => {
    assert.deepEqual(precioDePlan('xangarro', 'year'), {
      price: '1,990',
      period: 'MXN / año + IVA',
    });
    assert.deepEqual(precioDePlan('xangarrote', 'year'), {
      price: '3,990',
      period: 'MXN / año + IVA',
    });
  });

  it('keeps the free plan free on either interval', () => {
    for (const interval of ['month', 'year'] as const) {
      assert.deepEqual(precioDePlan('xangarrito', interval), {
        price: '0',
        period: 'para siempre gratis',
      });
    }
  });
});
