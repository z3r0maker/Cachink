/**
 * Every email links the aviso de privacidad and the términos (board
 * PvCorreos): the ones with the full legal footer and the ones without it.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  renderActivationCodeEmail,
  renderGenericNoticeEmail,
  renderMagicLinkEmail,
  renderWelcomeEmail,
} from '../src/index.js';

const AVISO = /href="https:\/\/xangarro\.mx\/privacidad\/"/;
const TERMINOS = /href="https:\/\/xangarro\.mx\/terminos\/?"/;

describe('the default footer', () => {
  it.each([
    [
      'welcome',
      () =>
        renderWelcomeEmail({
          name: 'Pedro',
          nombreNegocio: 'Taquería Don Pedro',
          comoEmpiezoUrl: 'https://portal.xangarro.mx/como-empiezo',
        }),
    ],
    ['magic link', () => renderMagicLinkEmail({ url: 'https://x.mx/l', expiresInMinutes: 15 })],
    [
      'activation code',
      () => renderActivationCodeEmail({ code: 'K7M3', negocio: 'Don Pedro', expiresInHours: 47 }),
    ],
    [
      'generic notice',
      () => renderGenericNoticeEmail({ subject: 'Aviso', preview: 'Aviso', paragraphs: ['Hola'] }),
    ],
  ])('%s links the aviso and the términos', async (_name, render) => {
    const e = await render();
    assert.match(e.html, AVISO);
    assert.match(e.html, TERMINOS);
    assert.match(e.text, /Aviso de privacidad/);
  });

  it('keeps its own lines: why it came, where to ask, the tagline', async () => {
    const e = await renderMagicLinkEmail({ url: 'https://x.mx/l', expiresInMinutes: 15 });
    assert.match(e.text, /¿Dudas\? Responde a este correo y te ayudamos\./);
    assert.match(e.text, /Xangarro · Finanzas para emprendedores/);
    assert.doesNotMatch(e.text, /MEXIA/, 'the supplier block stays on the legal footer');
  });
});
