import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  lectorTecla,
  MIN_CODIGO,
  RAFAGA_MS,
  SIN_RAFAGA,
  type Rafaga,
} from '../src/app/(portal)/productos/lector';

/**
 * A barcode reader on the page (P-44): a burst of keys ending in Enter is a
 * code; a person's typing, a short burst or a stray key never is.
 */
function teclear(teclas: string, gap: number, inicio = 1_000) {
  let r: Rafaga = SIN_RAFAGA;
  let codigo: string | null = null;
  [...teclas, 'Enter'].forEach((t, i) => {
    const paso = lectorTecla(r, t, inicio + i * gap);
    r = paso.rafaga;
    codigo = paso.codigo;
  });
  return codigo;
}

describe('lectorTecla', () => {
  it('reads a reader’s EAN-13 burst ending in Enter', () => {
    assert.equal(teclear('7501055300075', 8), '7501055300075');
  });

  it('keeps Code 39’s letters and signs', () => {
    assert.equal(teclear('ABC-128/9', 5), 'ABC-128/9');
  });

  it('ignores a person typing, slower than a reader', () => {
    assert.equal(teclear('7501055300075', RAFAGA_MS + 40), null);
  });

  it('ignores a burst shorter than any barcode', () => {
    assert.equal(teclear('7'.repeat(MIN_CODIGO - 1), 5), null);
  });

  it('starts over after a pause, so only the burst before Enter counts', () => {
    let r = lectorTecla(SIN_RAFAGA, '9', 0).rafaga;
    r = lectorTecla(r, '9', 5_000).rafaga;
    assert.equal(r.texto, '9', 'the pause dropped the first key');
  });

  it('lets the Shift a reader sends before a capital pass', () => {
    const r = lectorTecla({ texto: 'ABC', ultima: 10 }, 'Shift', 14).rafaga;
    assert.equal(lectorTecla(r, 'D', 16).rafaga.texto, 'ABCD');
  });

  it('drops the burst on a key no barcode carries', () => {
    const r = lectorTecla({ texto: '750105', ultima: 10 }, 'Tab', 15).rafaga;
    assert.equal(r.texto, '');
  });
});
