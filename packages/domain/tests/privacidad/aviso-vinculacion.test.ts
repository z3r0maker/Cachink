import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  AVISO_PUBLICO_URL,
  AVISO_VINCULACION,
  AVISO_VINCULACION_ENLACE,
  AVISO_VINCULACION_VERSION,
  TERMINOS_PUBLICO_URL,
  avisoVinculacionTexto,
  avisoVinculacionTextoDe,
} from '../../src/index.js';

/**
 * The device-linking aviso (N-34, variante B): what the law needs is that the
 * notice was put in front of the operator, so the device sends the version it
 * showed and the server hashes this exact text onto the device row. The hash
 * is only as good as the text being deterministic and versioned.
 */
describe('aviso de vinculación', () => {
  it('the hashed text is the version, each paragraph, then the button and its address', () => {
    const lineas = avisoVinculacionTexto().split('\n');
    assert.equal(lineas[0], AVISO_VINCULACION_VERSION);
    assert.deepEqual(lineas.slice(1, 4), [...AVISO_VINCULACION]);
    assert.equal(lineas[4], `${AVISO_VINCULACION_ENLACE}: ${AVISO_PUBLICO_URL}`);
    assert.ok(lineas[2]?.includes('por cuenta del negocio'));
  });

  it('is stable: the same text every time, so an old hash still matches', () => {
    assert.equal(avisoVinculacionTexto(), avisoVinculacionTexto());
    assert.equal(avisoVinculacionTextoDe(AVISO_VINCULACION_VERSION), avisoVinculacionTexto());
  });

  it('keeps 0.2 word for word, so a device on an older build keeps its hash', () => {
    const viejo = avisoVinculacionTextoDe('0.2-borrador');
    assert.ok(viejo?.startsWith('0.2-borrador\nTu privacidad.'));
    assert.ok(viejo?.endsWith('\nAviso completo y derechos ARCO: xangarro.mx/privacidad'));
  });

  it('knows no version it never published, nor names inherited from Object', () => {
    assert.equal(avisoVinculacionTextoDe('9.9'), undefined);
    assert.equal(avisoVinculacionTextoDe(''), undefined);
    assert.equal(avisoVinculacionTextoDe('toString'), undefined);
  });

  it('shows no raw address: the link is the button (5.1.1(i), style guide)', () => {
    assert.ok(AVISO_VINCULACION.every((p) => !p.includes('xangarro.mx')));
    assert.ok(AVISO_VINCULACION[2]?.includes('derechos ARCO'));
  });

  it('points at the public site, not the portal (ADR-069)', () => {
    assert.equal(AVISO_PUBLICO_URL, 'https://xangarro.mx/privacidad/');
    assert.equal(TERMINOS_PUBLICO_URL, 'https://xangarro.mx/terminos/');
  });
});
