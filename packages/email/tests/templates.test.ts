/**
 * Snapshot tests for every template (B-14 acceptance): the HTML and its
 * plain-text alternative are pinned, and the lines that matter are asserted
 * so a snapshot update cannot quietly drop them.
 */
import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';

import {
  pesos,
  renderGenericNoticeEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
  renderStaffDigestEmail,
  renderTrialEmail,
  renderUsageThresholdEmail,
} from '../src/index.js';

const SUSCRIPCION = 'https://portal.xangarro.mx/suscripcion';
const TRIAL_END = '2026-09-21T03:00:00.000Z'; // 20 Sep, 21:00 in Mexico City

describe('trial emails (N-01)', () => {
  it('day 11: ending in 3 days, card or SPEI, prices + IVA', async () => {
    const e = await renderTrialEmail({
      stage: 'ending',
      plan: 'xangarro',
      trialEnd: TRIAL_END,
      subscriptionUrl: SUSCRIPCION,
      name: 'Tacos Don Pepe',
    });
    assert.equal(e.subject, 'Tu prueba termina en 3 días');
    assert.match(e.text, /20 de septiembre de 2026/);
    assert.match(e.text, /SPEI/);
    assert.match(e.text, /\$199 \+ IVA al mes/);
    assert.match(e.html, /href="https:\/\/portal\.xangarro\.mx\/suscripcion"/);
    expect(e).toMatchSnapshot();
  });

  it('day 14: ended, the business fell to Xangarrito and keeps its data', async () => {
    const e = await renderTrialEmail({
      stage: 'ended',
      plan: 'xangarrote',
      trialEnd: TRIAL_END,
      subscriptionUrl: SUSCRIPCION,
      name: null,
    });
    assert.equal(e.subject, 'Tu prueba terminó: tu negocio sigue en Xangarrito');
    assert.match(e.text, /Xangarrito/);
    assert.match(e.text, /\$399 \+ IVA al mes/);
    expect(e).toMatchSnapshot();
  });
});

describe('usage threshold (N-03)', () => {
  it.each([80, 100] as const)('%i %% is celebratory, lists prices + IVA', async (threshold) => {
    const e = await renderUsageThresholdEmail({
      threshold,
      metric: 'transactions',
      used: threshold === 80 ? 1_200 : 1_500,
      limit: 1_500,
      plansUrl: SUSCRIPCION,
      name: 'Tacos Don Pepe',
    });
    assert.match(e.subject, /creciendo/);
    assert.doesNotMatch(e.text, /bloque|suspend|multa|penal/i);
    assert.match(e.text, /IVA/);
    assert.match(e.text, /Xangarrote: \$399 \+ IVA/);
    expect(e).toMatchSnapshot();
  });
});

describe('auth links (ADR-080)', () => {
  it('password reset carries the link, its lifetime and a fallback', async () => {
    const url = 'https://portal.xangarro.mx/restablecer?t=abc';
    const e = await renderPasswordResetEmail({ url, expiresInMinutes: 30 });
    assert.equal(e.subject, 'Restablece tu contraseña de Xangarro');
    assert.match(e.text, /30 minutos/);
    assert.ok(e.text.includes(url));
    expect(e).toMatchSnapshot();
  });

  it('magic link', async () => {
    const url = 'https://portal.xangarro.mx/entrar?t=xyz';
    const e = await renderMagicLinkEmail({ url, expiresInMinutes: 15 });
    assert.equal(e.subject, 'Tu enlace para entrar a Xangarro');
    assert.ok(e.html.includes(url));
    expect(e).toMatchSnapshot();
  });
});

describe('staff digest (N-10)', () => {
  it('renders sections with links, urgent tags, empty lines and notes', async () => {
    const e = await renderStaffDigestEmail({
      subject: 'Xangarro · Resumen del 17 sep — 1 nuevo · 1 urgente',
      sections: [
        {
          title: 'Nuevos · Soporte (1)',
          empty: null,
          lines: [
            { label: 'No sincroniza', href: 'https://admin.xangarro.mx/inbox/i1', urgent: true },
          ],
          note: null,
        },
        { title: 'Urgentes abiertos (0)', empty: 'Ningún urgente abierto.', lines: [], note: null },
        {
          title: 'Rechazos (24 h): 2',
          empty: null,
          lines: [{ label: 'FK_PRODUCT_MISSING: 2' }],
          note: 'Revisa el detalle en Studio.',
        },
      ],
    });
    assert.match(e.text, /URGENTE/);
    assert.match(e.text, /Ningún urgente abierto/);
    assert.match(e.html, /href="https:\/\/admin\.xangarro\.mx\/inbox\/i1"/);
    expect(e).toMatchSnapshot();
  });
});

describe('generic notice', () => {
  it('escapes text and renders an optional CTA', async () => {
    const e = await renderGenericNoticeEmail({
      subject: 'Recibimos tu solicitud ARCO',
      preview: 'Te respondemos en 20 días hábiles.',
      paragraphs: ['Hola:', 'Recibimos tu solicitud <b>ARCO</b>.'],
      cta: { label: 'Ver solicitud', href: 'https://portal.xangarro.mx/privacidad' },
      reason: 'Recibes este correo porque hiciste una solicitud ARCO.',
    });
    assert.ok(e.html.includes('&lt;b&gt;ARCO&lt;/b&gt;'));
    assert.ok(!e.html.includes('<b>ARCO</b>'));
    expect(e).toMatchSnapshot();
  });

  it('renders without a CTA', async () => {
    const e = await renderGenericNoticeEmail({
      subject: 'Aviso',
      preview: 'Aviso',
      paragraphs: ['Solo texto.'],
    });
    assert.doesNotMatch(e.html, /<a /);
  });
});

describe('pesos', () => {
  it('shows whole pesos without decimals and fractions with two', () => {
    assert.equal(pesos(19_900), '$199');
    assert.equal(pesos(199_000), '$1,990');
    assert.equal(pesos(23_084), '$230.84');
  });
});
