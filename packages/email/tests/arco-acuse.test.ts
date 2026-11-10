/** The ARCO acuse (Reglamento art. 95): the facts the law asks for, asserted; the rest pinned. */
import assert from 'node:assert/strict';
import { parseIsoDate } from '@xangarro/domain';
import { describe, expect, it } from 'vitest';

import { renderArcoAcuseEmail } from '../src/index.js';

const base = {
  folio: 'ARCO-01JD8T4K7Q2M5X9B3C6F0H1N2P',
  nombre: 'Ana López',
  derecho: 'cancelacion' as const,
  recibidaEn: '2026-11-10T00:42:00.000Z', // 9 Nov, 18:42 in Mexico City
  responderA: parseIsoDate('2026-12-07'),
};

describe('ARCO acuse email', () => {
  it('carries the folio, the moment received, the right and the deadline', async () => {
    const e = await renderArcoAcuseEmail(base);
    assert.equal(
      e.subject,
      'Recibimos tu solicitud sobre tus datos · Folio ARCO-01JD8T4K7Q2M5X9B3C6F0H1N2P',
    );
    assert.match(e.text, /Hola, Ana López/);
    assert.match(e.text, /9 de noviembre de 2026, 18:42/);
    assert.match(e.text, /Cancelación de tus datos/);
    assert.match(e.text, /7 de diciembre de 2026/);
    assert.match(e.text, /20 días hábiles/);
    expect(e).toMatchSnapshot();
  });

  it('reads the deadline as a Mexico City day, not the UTC midnight before it', async () => {
    const e = await renderArcoAcuseEmail({ ...base, responderA: parseIsoDate('2026-12-01') });
    assert.match(e.text, /1 de diciembre de 2026/);
    assert.doesNotMatch(e.text, /30 de noviembre/);
  });

  it('names each right in words the titular wrote it in', async () => {
    const e = await renderArcoAcuseEmail({ ...base, derecho: 'revocacion' });
    assert.match(e.text, /Revocación de tu consentimiento/);
    assert.doesNotMatch(e.text, /revocacion/);
  });

  it('carries the full legal footer: supplier, complaints, aviso and términos', async () => {
    const e = await renderArcoAcuseEmail(base);
    assert.match(e.text, /MEXIA, S\.A\.S\./);
    assert.match(e.text, /quejas/);
    assert.match(e.html, /href="https:\/\/xangarro\.mx\/privacidad\/"/);
    assert.match(e.text, /Términos y condiciones/);
  });
});
