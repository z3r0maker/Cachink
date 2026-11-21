import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  respuestaInvalida,
  RESPUESTAS_RAPIDAS,
  RESPUESTA_MAX,
  RESPUESTA_MIN,
  TOAST_GUARDADA,
  toastRespuesta,
} from '../src/avisos/movil';
import { AVISOS_COPY } from '../src/avisos/copy';

describe('la respuesta de un aviso, móvil', () => {
  it('the quick answers write whole sentences, one tap each', () => {
    assert.deepEqual(
      RESPUESTAS_RAPIDAS.map((r) => r.label),
      ['Di cambio de más', 'Cobré y no capturé', 'Salió un vale', 'No sé qué pasó'],
    );
    for (const r of RESPUESTAS_RAPIDAS) {
      assert.ok(r.texto.endsWith('.'));
      assert.ok(respuestaInvalida(r.texto) === null);
    }
  });

  it('a reply needs a real sentence: empty, too short, too long', () => {
    assert.equal(respuestaInvalida(''), 'Escríbeles algo, aunque sea «no sé qué pasó».');
    assert.equal(respuestaInvalida('   '), 'Escríbeles algo, aunque sea «no sé qué pasó».');
    assert.equal(respuestaInvalida('no'), 'Cuéntales un poco más para que les sirva.');
    assert.equal(respuestaInvalida('no sé'.repeat(200)), `Máximo ${RESPUESTA_MAX} caracteres.`);
    assert.equal(respuestaInvalida('No sé qué pasó.'), null);
    assert.equal(RESPUESTA_MIN, 4);
  });

  it('the toast says «los patrones» have it, and what it was about', () => {
    assert.equal(
      toastRespuesta('el corte del 13 de mayo'),
      'Los patrones ya tienen tu respuesta sobre el corte del 13 de mayo.',
    );
    assert.equal(
      toastRespuesta('su mensaje'),
      'Los patrones ya tienen tu respuesta sobre su mensaje.',
    );
  });
});

describe('la respuesta sin internet (R6)', () => {
  it('says it is saved and reaches «los patrones» when the signal returns', () => {
    assert.equal(
      TOAST_GUARDADA,
      'Tu respuesta se guardó. Les llega a los patrones cuando vuelva la señal.',
    );
  });
});

describe('Avisos les dice «los patrones» (M-25)', () => {
  it('words every line about the owner in plural, never a name', () => {
    assert.deepEqual(AVISOS_COPY, {
      sub: 'Lo que te mandan los patrones y lo que la caja te avisa',
      tab: 'De los patrones',
      firma: 'Los patrones',
      tipoMensaje: 'Mensaje de los patrones',
      vacio: 'Ni mensajes de los patrones ni avisos de tu caja.',
      nadaNuevo: 'Los patrones no te han escrito nada nuevo.',
      responder: 'Responder a los patrones',
      cuentales: 'Cuéntales a los patrones lo que recuerdas',
      enviada: 'Les mandaste tu respuesta a los patrones',
    });
  });
});
