/**
 * The corte both cajas send (M-17 on the phone, P-43 on the computer): one
 * builder from the closed turno's data, and the notice while records wait.
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { diferenciaCorte } from '@xangarro/domain';

import { avisoPorEnviar, corteDeCierre, mensajeCorte } from '../src/cierre/patrones';
import type { CierreData } from '../src/cierre/types';

const DATA: CierreData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  hasta: '21:04',
  dueno: 'Pedro',
  negocio: 'Taquería Don Pedro',
  partes: { fondo: 500_00n, ventasEfectivo: 2_210_00n, abonosEfectivo: 0n, gastosEfectivo: 0n },
  resumen: {
    ventas: 12,
    cobrado: 3_120_00n,
    canceladas: 0,
    cancelado: 0n,
    fiado: 0n,
    entradas: 0,
    mermas: 0,
  },
  conteo: {},
};

const cuenta = (contado: bigint) => ({
  contado,
  esperado: 2_710_00n,
  dif: diferenciaCorte(contado, 2_710_00n),
});

describe('corteDeCierre', () => {
  it('turns a closed turno into the message, one fact per line', () => {
    const c = corteDeCierre(DATA, cuenta(2_710_00n), null, '18 nov');
    assert.equal(
      mensajeCorte(c),
      [
        'Corte de caja · Taquería Don Pedro',
        'Caja 1 · Ana Robledo · 18 nov, 08:15 a 21:04',
        'Contado: $2,710.00',
        'Esperado: $2,710.00',
        'Cuadró al centavo.',
        '12 ventas · Cobrado $3,120.00',
      ].join('\n'),
    );
  });

  it('carries the reason of a difference', () => {
    const c = corteDeCierre(DATA, cuenta(2_660_00n), 'Di cambio de más', '18 nov');
    assert.match(mensajeCorte(c), /^Faltante: \$50\.00 \(Di cambio de más\)$/m);
  });

  it('leaves the business out when the caja does not know it', () => {
    const { negocio: _sin, ...sinNegocio } = DATA;
    const c = corteDeCierre(sinNegocio, cuenta(2_710_00n), null, '18 nov');
    assert.equal(c.negocio, undefined);
    assert.equal(mensajeCorte(c).split('\n')[0], 'Corte de caja');
  });

  it('never puts the owner in the message', () => {
    const c = corteDeCierre(DATA, cuenta(2_740_00n), 'Me dejaron propina', '18 nov');
    assert.doesNotMatch(mensajeCorte(c), /Pedro (ya|lo)|dueño|patr/);
  });
});

describe('avisoPorEnviar', () => {
  it('counts the records, one or many', () => {
    assert.equal(
      avisoPorEnviar(1),
      'Tienes 1 registro por enviar. Se envía solo en cuanto haya conexión.',
    );
    assert.equal(
      avisoPorEnviar(3),
      'Tienes 3 registros por enviar. Se envían solos en cuanto haya conexión.',
    );
  });
});
