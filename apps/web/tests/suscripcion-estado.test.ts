import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { BillingStatusSnapshot } from '@xangarro/application/billing';

import { estadoCopy, estadoTono, TONO_LABEL } from '../src/app/(portal)/suscripcion/estado';

const snap = (
  status: BillingStatusSnapshot['status'],
  over: Partial<BillingStatusSnapshot> = {},
): BillingStatusSnapshot => ({
  planId: 'xangarro',
  status,
  interval: 'month',
  currentPeriodEnd: '2026-06-01T06:00:00Z',
  cancelAt: null,
  stripeCustomerId: 'cus_x',
  ...over,
});

describe('estadoCopy', () => {
  it('no subscription is the free plan, with nothing to fix', () => {
    assert.deepEqual(estadoCopy(null), { linea: 'Gratis para siempre.', aviso: null });
  });

  it('active and trialing name the date on the business clock', () => {
    assert.equal(
      estadoCopy(snap('active')).linea,
      'Siguiente cobro: 1 de junio de 2026 · $230.84 con IVA',
    );
    assert.match(estadoCopy(snap('active', { interval: 'year' })).linea, /\$2,308\.40 con IVA/);
    assert.equal(estadoCopy(snap('trialing')).linea, 'Prueba gratis hasta el 1 de junio de 2026.');
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

  it('cancelled but running: the end date, no more charges, its own tag (LFPC 76 Bis)', () => {
    const s = snap('active', { cancelAt: '2026-06-01T06:00:00Z' });
    assert.equal(estadoCopy(s).linea, 'Termina el 1 de junio de 2026. No se te cobrará más.');
    assert.equal(TONO_LABEL[estadoTono(s)], 'Se cancela');
  });

  it('past due keeps its warning even when cancelled; lapsed is just lapsed', () => {
    const atrasado = snap('past_due', { cancelAt: '2026-06-01T06:00:00Z' });
    assert.equal(estadoTono(atrasado), 'atrasado');
    assert.equal(estadoTono(snap('lapsed', { cancelAt: '2026-05-01T06:00:00Z' })), 'vencido');
  });
});
