import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  autonomia,
  cajaAl,
  flujoMensual,
  MontoInvalidoError,
  type MovimientoCaja,
} from '../../src/corp/index.js';

/**
 * «Autonomía sin nuevo capital» (E-16, board CD-12): can the operation go on
 * without the partners putting money in? Every amount is in centavos; a
 * movement is one entry's net effect on Bancos plus Stripe por depositar.
 */
const mov = (fecha: string, pesos: number, socios = false): MovimientoCaja => ({
  fecha,
  importe: BigInt(pesos * 100),
  socios,
});

const MESES = ['2026-07', '2026-08', '2026-09'];

/** The partners fund $200,000, then three months of a business that makes money. */
const SANA = [
  mov('2026-06-15', 200_000, true),
  ...MESES.flatMap((m) => [mov(`${m}-05`, 40_000), mov(`${m}-20`, -25_000)]),
];

describe('cajaAl', () => {
  it('adds every movement up to the day, partner money included', () => {
    assert.equal(cajaAl(SANA, '2026-06-30'), 200_000_00n);
    assert.equal(cajaAl(SANA, '2026-09-30'), 245_000_00n);
    assert.equal(cajaAl(SANA, '2026-07-10'), 240_000_00n);
  });

  it('is zero before the first movement', () => {
    assert.equal(cajaAl(SANA, '2026-01-01'), 0n);
  });
});

describe('flujoMensual', () => {
  it('splits each month into what came in and what went out, partners apart', () => {
    const f = flujoMensual([...SANA, mov('2026-08-28', 50_000, true)], MESES);
    assert.deepEqual(
      f.map((m) => [m.mes, m.entra, m.sale]),
      MESES.map((m) => [m, 40_000_00n, 25_000_00n]),
    );
  });

  it('counts a refund to a partner as theirs, not as spending', () => {
    const f = flujoMensual([mov('2026-07-09', -10_000, true)], ['2026-07']);
    assert.deepEqual([f[0]?.entra, f[0]?.sale], [0n, 0n]);
  });
});

describe('autonomia', () => {
  it('says a business that keeps cash is self-sufficient, and how far income may fall', () => {
    const a = autonomia(SANA, '2026-09-30', MESES);
    assert.equal(a.autosuficiente, true);
    assert.deepEqual(
      [a.caja, a.entra, a.sale, a.neto],
      [245_000_00n, 40_000_00n, 25_000_00n, 15_000_00n],
    );
    assert.equal(a.enDoceMeses, 425_000_00n);
    assert.equal(a.caidaMaximaBps, 3750);
    assert.equal(a.equilibrio, 25_000_00n);
    assert.equal(a.mesesDeCaja, null, 'no burn: «Sin consumo»');
    assert.equal(a.mesesSinIngresos, 9.8);
    assert.equal(a.mesesConDatos, 3);
  });

  it('says how long the cash lasts when the business burns it', () => {
    const quema = [
      mov('2026-06-15', 100_000, true),
      ...MESES.flatMap((m) => [mov(`${m}-05`, 10_000), mov(`${m}-20`, -30_000)]),
    ];
    const a = autonomia(quema, '2026-09-30', MESES);
    assert.equal(a.autosuficiente, false);
    assert.equal(a.neto, -20_000_00n);
    assert.equal(a.caja, 40_000_00n);
    assert.equal(a.mesesDeCaja, 2);
    assert.equal(a.mesesSinIngresos, 1.3);
    assert.deepEqual([a.enDoceMeses, a.caidaMaximaBps], [null, null]);
    assert.equal(a.equilibrio, 30_000_00n, 'income must reach what goes out');
  });

  it('averages only the months the company had money, so a new company is not diluted', () => {
    const nueva = [
      mov('2026-08-01', 50_000, true),
      mov('2026-08-10', 9_000),
      mov('2026-09-10', -3_000),
    ];
    const a = autonomia(nueva, '2026-09-30', MESES);
    assert.equal(a.mesesConDatos, 2);
    assert.deepEqual([a.entra, a.sale], [4_500_00n, 1_500_00n]);
  });

  it('has no answer at all before the first movement, never a misleading zero', () => {
    const a = autonomia([], '2026-09-30', MESES);
    assert.equal(a.mesesConDatos, 0);
    assert.equal(a.autosuficiente, null);
    assert.deepEqual(
      [a.enDoceMeses, a.caidaMaximaBps, a.equilibrio, a.mesesDeCaja, a.mesesSinIngresos],
      [null, null, null, null, null],
    );
  });

  it('cannot say how far income may fall when there is none', () => {
    const solo = [mov('2026-07-01', 30_000, true)];
    const a = autonomia(solo, '2026-09-30', MESES);
    assert.equal(a.autosuficiente, true, 'nothing goes out');
    assert.deepEqual([a.caidaMaximaBps, a.mesesSinIngresos, a.mesesDeCaja], [null, null, null]);
  });

  it('runs out at once when the cash is already gone', () => {
    const rojo = [mov('2026-07-05', 1_000), mov('2026-07-20', -5_000)];
    const a = autonomia(rojo, '2026-09-30', MESES);
    assert.equal(a.caja, -4_000_00n);
    assert.deepEqual([a.mesesDeCaja, a.mesesSinIngresos], [0, 0]);
  });

  it('refuses a reading with no months', () => {
    assert.throws(() => autonomia(SANA, '2026-09-30', []), MontoInvalidoError);
  });
});
