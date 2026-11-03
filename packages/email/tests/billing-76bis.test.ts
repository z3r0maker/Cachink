/**
 * The renewal reminder and the cancellation acuse (LFPC art. 76 Bis,
 * ADR-132): what the law needs is asserted line by line, the rest pinned.
 */
import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';

import { renderCancellationEmail, renderRenewalEmail } from '../src/index.js';
import { periodoRenovado } from '../src/templates/renewal-dates.js';

const CHARGE = '2026-10-31T18:00:00.000Z'; // 31 Oct, noon in Mexico City
const CANCEL = 'https://app.xangarro.mx/cancelar?t=abc';

const base = {
  plan: 'xangarro',
  negocio: 'Taquería Don Pedro',
  chargeAt: CHARGE,
  cancelUrl: CANCEL,
} as const;

describe('renewal reminder', () => {
  it('card, monthly: date, period, total with IVA, the one-click cancel and the supplier', async () => {
    const e = await renderRenewalEmail({
      ...base,
      kind: 'card',
      interval: 'month',
      totalCentavos: 23_084,
    });
    assert.equal(e.subject, 'Tu plan Xangarro se renueva el 31 de octubre');
    assert.match(e.text, /El 31 de octubre de 2026 renovamos el plan de Taquería Don Pedro/);
    assert.match(e.text, /31 oct al 29 nov de 2026/);
    assert.match(e.text, /\$230\.84 MXN, IVA incluido/);
    assert.match(e.html, /href="https:\/\/app\.xangarro\.mx\/cancelar\?t=abc"/);
    assert.match(e.text, /Cancelar mi suscripción/);
    assert.match(e.text, /MEXIA, S\.A\.S\. · Paseo Lomas Altas 524/);
    assert.match(e.text, /¿Dudas o quejas\?/);
    assert.doesNotMatch(e.text, /TELÉFONO/);
    expect(e).toMatchSnapshot();
  });

  it('card, annual: a year on, the annual total', async () => {
    const e = await renderRenewalEmail({
      ...base,
      kind: 'card',
      interval: 'year',
      totalCentavos: 230_840,
    });
    assert.equal(e.subject, 'Tu plan Xangarro anual se renueva el 31 de octubre');
    assert.match(e.text, /31 oct 2026 al 30 oct 2027/);
    assert.match(e.text, /\$2,308\.40 MXN, IVA incluido/);
  });

  it('SPEI, annual: speaks of the invoice and the CLABE, never of a card', async () => {
    const e = await renderRenewalEmail({
      ...base,
      kind: 'spei',
      interval: 'year',
      totalCentavos: 230_840,
    });
    assert.equal(e.subject, 'Tu plan Xangarro anual vence el 31 de octubre');
    assert.match(e.text, /CLABE/);
    assert.doesNotMatch(e.text, /tarjeta que registraste/);
    expect(e).toMatchSnapshot();
  });

  it('without a business name it still reads', async () => {
    const e = await renderRenewalEmail({
      ...base,
      negocio: null,
      kind: 'card',
      interval: 'month',
      totalCentavos: 23_084,
    });
    assert.match(e.text, /renovamos tu plan/);
  });

  it('a period starting on the 31st ends on the last day before the next charge', () => {
    assert.equal(periodoRenovado('2027-01-31T18:00:00.000Z', 'month'), '31 ene al 27 feb de 2027');
  });
});

describe('cancellation acuse', () => {
  const props = {
    plan: 'xangarro',
    interval: 'month',
    negocio: 'Taquería Don Pedro',
    endsAt: CHARGE,
    requestedAt: '2026-10-31T00:42:00.000Z', // 30 Oct, 18:42 in Mexico City
    folio: 'CX-7F3A21',
    subscriptionUrl: 'https://app.xangarro.mx/suscripcion',
  } as const;

  it('states the end date, the folio and the moment, and offers to undo it', async () => {
    const e = await renderCancellationEmail(props);
    assert.equal(e.subject, 'Cancelaste tu plan Xangarro');
    assert.match(e.text, /sigue hasta el 31 de octubre de 2026 y no se te cobrará más/);
    assert.match(e.text, /CX-7F3A21/);
    assert.match(e.text, /30 de octubre de 2026, 18:42/);
    assert.match(e.text, /comprobante de cancelación/);
    assert.match(e.html, /href="https:\/\/app\.xangarro\.mx\/suscripcion"/);
    expect(e).toMatchSnapshot();
  });

  it('without a business name the row is left out', async () => {
    const e = await renderCancellationEmail({ ...props, negocio: null });
    assert.doesNotMatch(e.text, /Negocio/);
  });
});
