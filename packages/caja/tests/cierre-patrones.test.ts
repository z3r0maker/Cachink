/**
 * The phone's close wording (M-16, ADR-146): «los patrones», never a name;
 * the done line by difference and queue; the cash reminder; the corte the
 * operator sends.
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { diferenciaCorte } from '@xangarro/domain';

import {
  lineaHecho,
  mensajeCorte,
  NOTA_TITULO,
  pistaCerrar,
  pistaResultado,
  recordatorioEfectivo,
  TITULO_RESULTADO,
  type CorteParaMandar,
} from '../src/cierre/patrones';

const CUADRA = diferenciaCorte(2_710_00n, 2_710_00n);
const FALTA = diferenciaCorte(2_640_00n, 2_710_00n);
const SOBRA = diferenciaCorte(2_740_00n, 2_710_00n);

const CORTE: CorteParaMandar = {
  negocio: 'Taquería Don Pedro',
  caja: 'Caja 1',
  operador: 'Ana Robledo',
  fecha: '18 nov',
  desde: '08:15',
  hasta: '21:04',
  contado: 2_710_00n,
  esperado: 2_710_00n,
  dif: CUADRA,
  motivo: null,
  ventas: 12,
  cobrado: 3_120_00n,
};

describe('el cierre del teléfono · los patrones', () => {
  it('a cuadre thanks the operator and says the owner already has it', () => {
    assert.equal(
      lineaHecho(CUADRA, null, 0, 'Ana Robledo'),
      'El conteo cuadró con lo esperado. Los patrones ya lo tienen en su portal. Gracias por tu turno, Ana.',
    );
  });

  it('with records still to send, the owner sees it once they go up', () => {
    assert.match(lineaHecho(CUADRA, null, 3, 'Ana'), /lo verán en su portal cuando se envíen/);
    assert.doesNotMatch(lineaHecho(CUADRA, null, 3, 'Ana'), /ya lo tienen/);
  });

  it('a difference says its reason and never thanks; a blank name never prints a comma', () => {
    assert.equal(
      lineaHecho(FALTA, 'Cambio mal dado', 0, 'Ana'),
      'Quedó un faltante explicado como «Cambio mal dado». Los patrones ya lo tienen en su portal.',
    );
    assert.match(lineaHecho(SOBRA, 'Salió un vale', 0, 'Ana'), /^Quedó un sobrante/);
    assert.equal(
      lineaHecho(CUADRA, null, 0, '  '),
      'El conteo cuadró con lo esperado. Los patrones ya lo tienen en su portal. Gracias por tu turno.',
    );
  });

  it('never names the owner, and never mixes in English', () => {
    const textos = [
      NOTA_TITULO,
      recordatorioEfectivo(2_710_00n),
      lineaHecho(FALTA, 'Otra razón', 2, 'Ana'),
      pistaCerrar(false, false),
    ];
    for (const t of textos) assert.doesNotMatch(t, /dueño|Reviewer|Don\b|boss|manager/);
    assert.equal(recordatorioEfectivo(2_710_00n), 'Guarda $2,710.00 para los patrones.');
  });

  it('step 2 says what the count did; the hint says what is missing', () => {
    assert.equal(TITULO_RESULTADO[FALTA.tipo], 'Falta efectivo');
    assert.equal(pistaResultado(CUADRA), 'Lo contado coincide con lo esperado. Puedes cerrar.');
    assert.equal(pistaCerrar(true, false), 'Elige un motivo para poder cerrar.');
    assert.equal(pistaCerrar(false, true), 'Escribe la nota para poder cerrar.');
    assert.match(pistaCerrar(false, false), /abres otro turno/);
  });

  it('the corte message carries one fact per line', () => {
    assert.equal(
      mensajeCorte(CORTE),
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

  it('the message names a difference with its reason, and copes with no business or one sale', () => {
    const m = mensajeCorte({
      ...CORTE,
      negocio: undefined,
      contado: 2_640_00n,
      dif: FALTA,
      motivo: 'Salió un vale',
      ventas: 1,
    } as CorteParaMandar);
    assert.match(m, /^Corte de caja\n/);
    assert.match(m, /Faltante: \$70\.00 \(Salió un vale\)/);
    assert.match(m, /1 venta · /);
    assert.doesNotMatch(m, /—/);
  });
});
