import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  AVISO_PUBLICO_URL,
  AVISO_VINCULACION,
  AVISO_VINCULACION_VERSION,
  avisoVinculacionTexto,
} from '../../src/index.js';

/**
 * The device-linking aviso (N-34, variante B): what the law needs is that the
 * notice was put in front of the operator, so the device sends the version it
 * showed and the server hashes this exact text onto the device row. The hash
 * is only as good as the text being deterministic and versioned.
 */
describe('aviso de vinculación', () => {
  it('the hashed text is the version, then each paragraph, joined', () => {
    const texto = avisoVinculacionTexto();
    assert.equal(texto.split('\n').length, 1 + AVISO_VINCULACION.length);
    assert.ok(texto.startsWith(`${AVISO_VINCULACION_VERSION}\n`));
    assert.ok(texto.includes('por cuenta del negocio'));
  });

  it('is stable: the same text every time, so an old hash still matches', () => {
    assert.equal(avisoVinculacionTexto(), avisoVinculacionTexto());
  });

  it('names the responsible and points at the public aviso, not the portal (ADR-069)', () => {
    assert.equal(AVISO_PUBLICO_URL, 'https://xangarro.mx/privacidad');
    assert.ok(AVISO_VINCULACION[2]?.includes('xangarro.mx/privacidad'));
    assert.ok(AVISO_VINCULACION_VERSION.length > 0);
  });
});
