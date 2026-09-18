import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { COLA_FIXTURE } from '../../src/operador/pendientes/fixture';
import { estadoFila, fase, heroe, suman } from '../../src/operador/pendientes/derive';
import type { RegistroEnCola } from '../../src/operador/pendientes/types';

const gasto = COLA_FIXTURE[2] as RegistroEnCola;

describe('registros por enviar', () => {
  it('words the waiting queue as the file does', () => {
    const h = heroe('espera', COLA_FIXTURE, 3);
    assert.equal(h.titulo, '3 registros en espera');
    assert.equal(
      h.cuerpo,
      'Suman $283.00 de ventas y un gasto de $620.00. El turno no se puede cerrar hasta que se envíen.',
    );
    assert.equal(h.boton, 'Reintentar envío');
  });

  it('moves through sending to sent', () => {
    assert.equal(fase(COLA_FIXTURE, true), 'enviando');
    assert.equal(heroe('enviando', COLA_FIXTURE, 3).titulo, 'Enviando 3 registros…');
    assert.equal(fase([], false), 'enviado');
    assert.equal(heroe('enviado', [], 0).titulo, 'Todo enviado');
  });

  it('labels each row by phase and connection', () => {
    assert.equal(estadoFila('enviando', true), 'Enviando');
    assert.equal(estadoFila('espera', true), 'Esperando conexión');
    assert.equal(estadoFila('espera', false), 'En cola');
  });

  it('sums sales and expenses however many there are', () => {
    assert.equal(suman(COLA_FIXTURE.slice(0, 2)), 'Suman $283.00 de ventas.');
    assert.equal(
      suman([...COLA_FIXTURE, { ...gasto, id: 'q-4' }]),
      'Suman $283.00 de ventas y 2 gastos por $1,240.00.',
    );
  });
});
