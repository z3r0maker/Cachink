import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  respuestaInvalida,
  RESPUESTAS_RAPIDAS,
  RESPUESTA_MAX,
  RESPUESTA_MIN,
  toastRespuesta,
} from '../src/avisos/movil';

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
    assert.equal(respuestaInvalida(''), 'Escríbele algo, aunque sea «no sé qué pasó».');
    assert.equal(respuestaInvalida('   '), 'Escríbele algo, aunque sea «no sé qué pasó».');
    assert.equal(respuestaInvalida('no'), 'Cuéntale un poco más para que le sirva.');
    assert.equal(respuestaInvalida('no sé'.repeat(200)), `Máximo ${RESPUESTA_MAX} caracteres.`);
    assert.equal(respuestaInvalida('No sé qué pasó.'), null);
    assert.equal(RESPUESTA_MIN, 4);
  });

  it('the toast names who has it and what it was about', () => {
    assert.equal(
      toastRespuesta('Pedro', 'el corte del 13 de mayo'),
      'Pedro ya tiene tu respuesta sobre el corte del 13 de mayo.',
    );
    assert.equal(
      toastRespuesta('el dueño', 'su mensaje'),
      'El dueño ya tiene tu respuesta sobre su mensaje.',
    );
  });
});
