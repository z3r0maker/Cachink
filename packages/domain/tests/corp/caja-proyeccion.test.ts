import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  autonomia,
  cajaAlCierre,
  flujoPorTipo,
  mesesDeHistoria,
  proyeccion,
  reservaMinima,
  devolverCabe,
  type MovimientoCajaConTipo,
} from '../../src/corp/caja/index.js';

/** Caja (E-23, board CD-15c): month-end cash, the three scenarios, the reserve, the month's flow. */
const mov = (
  fecha: string,
  importe: bigint,
  kind: MovimientoCajaConTipo['kind'],
  socios = false,
): MovimientoCajaConTipo => ({ fecha, importe, kind, socios });

const MOVS: readonly MovimientoCajaConTipo[] = [
  mov('2026-08-03', 60_000_00n, 'aportacion_capital', true),
  mov('2026-09-05', 22_000_00n, 'cobro'),
  mov('2026-09-10', -24_000_00n, 'gasto'),
  mov('2026-09-20', 80_000_00n, 'fondeo_mitades', true),
  mov('2026-10-05', 21_980_00n, 'cobro'),
  mov('2026-10-08', -350_00n, 'cobro'),
  mov('2026-10-12', -24_118_00n, 'gasto'),
  mov('2026-10-17', -1_135_33n, 'pago_impuestos'),
  mov('2026-10-31', -17_40n, 'comision_bancaria'),
  mov('2026-11-03', -3_500_00n, 'pago_proveedor'),
];

describe('cajaAlCierre', () => {
  it('reads cash at each month’s last day, today for the month running', () => {
    assert.deepEqual(
      cajaAlCierre(MOVS, ['2026-08', '2026-09', '2026-10', '2026-11'], '2026-11-19'),
      [
        { mes: '2026-08', caja: 60_000_00n },
        { mes: '2026-09', caja: 138_000_00n },
        { mes: '2026-10', caja: 134_359_27n },
        { mes: '2026-11', caja: 130_859_27n },
      ],
    );
  });

  it('starts at the first month with money, never before', () => {
    assert.deepEqual(mesesDeHistoria(MOVS, '2026-11-19'), [
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    assert.deepEqual(mesesDeHistoria([], '2026-11-19'), []);
  });
});

describe('proyeccion', () => {
  const a = autonomia(MOVS, '2026-11-19', ['2026-08', '2026-09', '2026-10']);

  it('carries today’s net, flat at break-even, and only spending without income', () => {
    const mantener = proyeccion(a, 'mantener', 3);
    assert.equal(mantener[0], a.caja + a.neto);
    assert.equal(mantener[2], a.caja + a.neto * 3n);
    assert.deepEqual(proyeccion(a, 'equilibrio', 2), [a.caja, a.caja]);
    assert.equal(proyeccion(a, 'detener', 1)[0], a.caja - a.sale);
  });

  it('never goes below zero', () => {
    const p = proyeccion(a, 'detener', 12);
    assert.ok(p.every((v) => v >= 0n));
    assert.equal(p.at(-1), 0n);
  });

  it('refuses a negative horizon', () => {
    assert.throws(() => proyeccion(a, 'mantener', -1), { code: 'MONTO_INVALIDO' });
  });
});

describe('the reserve and the partner loan', () => {
  it('is three months of spending', () => {
    assert.equal(reservaMinima(29_205_00n), 87_615_00n);
    assert.equal(reservaMinima(0n), 0n);
  });

  it('says whether a loan can be repaid without going below it', () => {
    assert.equal(devolverCabe(118_640_00n, 87_615_00n, 10_000_00n), true);
    assert.equal(devolverCabe(41_300_00n, 87_615_00n, 10_000_00n), false);
    assert.equal(devolverCabe(97_615_00n, 87_615_00n, 10_000_00n), true);
  });
});

describe('flujoPorTipo', () => {
  it('groups a month’s cash by kind, refunds netted, partner money apart', () => {
    const f = flujoPorTipo(MOVS, '2026-10');
    assert.deepEqual(f.tipos, [
      { tipo: 'cobros', importe: 21_630_00n },
      { tipo: 'gastos', importe: -24_118_00n },
      { tipo: 'impuestos', importe: -1_135_33n },
      { tipo: 'comisiones', importe: -17_40n },
    ]);
    assert.equal(f.operacion, 21_630_00n - 24_118_00n - 1_135_33n - 17_40n);
    assert.equal(f.socios, 0n);
    assert.equal(flujoPorTipo(MOVS, '2026-09').socios, 80_000_00n);
  });

  it('counts a supplier payment as spending, and leaves out kinds the month did not have', () => {
    assert.deepEqual(flujoPorTipo(MOVS, '2026-11').tipos, [
      { tipo: 'gastos', importe: -3_500_00n },
    ]);
    assert.deepEqual(flujoPorTipo(MOVS, '2026-12').tipos, []);
  });
});
