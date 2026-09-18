import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { BillingStatusSnapshot } from '@xangarro/application/billing';

import { estadoCopy } from '../src/app/(portal)/suscripcion/estado';

const snap = (status: BillingStatusSnapshot['status']): BillingStatusSnapshot => ({
  planId: 'xangarro',
  status,
  interval: 'month',
  currentPeriodEnd: '2026-06-01T06:00:00Z',
  stripeCustomerId: 'cus_x',
});

describe('estadoCopy', () => {
  it('no subscription is the free plan, with nothing to fix', () => {
    assert.deepEqual(estadoCopy(null), { linea: 'Gratis para siempre.', aviso: null });
  });

  it('active and trialing name the date on the business clock', () => {
    assert.equal(estadoCopy(snap('active')).linea, 'Siguiente cobro: 1 jun 2026.');
    assert.equal(estadoCopy(snap('trialing')).linea, 'Prueba gratis hasta el 1 jun 2026.');
    assert.equal(estadoCopy(snap('active')).aviso, null);
  });

  it('past due warns with the grace period and the fix', () => {
    const c = estadoCopy(snap('past_due'));
    assert.match(c.aviso ?? '', /7 días de gracia/);
    assert.match(c.aviso ?? '', /no se pierden/);
  });

  it('lapsed says where the account is now', () => {
    assert.match(estadoCopy(snap('lapsed')).aviso ?? '', /Estás en Xangarrito/);
  });
});
