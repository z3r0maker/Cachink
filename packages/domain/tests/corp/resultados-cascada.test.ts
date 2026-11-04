import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  CuentaFueraDeResultadosError,
  estadoDeResultados,
  importeDeLinea,
  parsePeriodo,
  type ImporteResultados,
} from '../../src/corp/resultados/index.js';

/**
 * E-12, §4's cascade. The fixture is board CD-07's September, worked by hand:
 * ingresos 38,400; costs 7,300 + 9,000 + 4,400 + 4,250 → utilidad bruta
 * 31,100 (81.0 %), EBITDA 13,450 (35.0 %); depreciación 154 and financiero 380
 * → UAI 12,916; ISR at 30 % of that (all cash) = 3,874.80 → neta 9,041.20.
 */
const SEP = parsePeriodo('2026-09')!;

let n = 0;
const imp = (
  cuenta: ImporteResultados['cuenta'],
  pesos: number,
  fecha = '2026-09-15',
  fechaFlujo: string | null = fecha,
): ImporteResultados => ({
  entryId: `e${++n}`,
  concepto: `${cuenta} ${n}`,
  cuenta,
  importe: BigInt(Math.round(pesos * 100)),
  fecha,
  fechaFlujo,
});

const SEPTIEMBRE: readonly ImporteResultados[] = [
  imp('ingresos', 38_400),
  imp('costo_servicio', 3_900),
  imp('costo_servicio', 3_400),
  imp('ventas_marketing', 9_000),
  imp('desarrollo', 4_400),
  imp('administracion', 4_250),
  imp('depreciacion', 154),
  imp('financiero', 380),
];

describe('estado de resultados', () => {
  it('matches the board fixture worked by hand', () => {
    const e = estadoDeResultados(SEPTIEMBRE, SEP, 'devengado');
    assert.equal(e.renglones.ingresos, 38_400_00n);
    assert.equal(e.renglones.costo_servicio, -7_300_00n);
    assert.equal(e.renglones.utilidad_bruta, 31_100_00n);
    assert.equal(e.renglones.ebitda, 13_450_00n);
    assert.equal(e.renglones.utilidad_operacion, 13_296_00n);
    assert.equal(e.renglones.utilidad_antes_impuestos, 12_916_00n);
    assert.equal(e.renglones.isr_estimado, -3_874_80n);
    assert.equal(e.renglones.utilidad_neta, 9_041_20n);
    assert.equal(e.margenBruto, 8_098);
    assert.equal(e.margenEbitda, 3_502);
    assert.equal(e.faltanGastos, false);
  });

  it('says «sin datos» for the margins of a month with income but no costs, never 100 %', () => {
    const e = estadoDeResultados([imp('ingresos', 1_000)], SEP, 'devengado');
    assert.equal(e.faltanGastos, true);
    assert.equal(e.margenBruto, null);
    assert.equal(e.margenEbitda, null);
    assert.equal(e.renglones.utilidad_bruta, 1_000_00n);
  });

  it('gives no margin without income, and an empty period is all zeros', () => {
    const sinIngresos = estadoDeResultados([imp('administracion', 500)], SEP, 'devengado');
    assert.equal(sinIngresos.margenBruto, null);
    assert.equal(sinIngresos.renglones.ebitda, -500_00n);
    const vacio = estadoDeResultados([], SEP, 'devengado');
    assert.equal(vacio.renglones.utilidad_neta, 0n);
    assert.equal(vacio.faltanGastos, true);
  });

  it('counts an invoice on credit when invoiced (devengado) or when paid (flujo)', () => {
    const credito = [
      imp('ingresos', 10_000),
      imp('administracion', 1_000),
      imp('administracion', 4_000, '2026-09-30', '2026-10-05'),
      imp('desarrollo', 2_000, '2026-09-20', null),
    ];
    const dev = estadoDeResultados(credito, SEP, 'devengado');
    assert.equal(dev.renglones.administracion, -5_000_00n);
    assert.equal(dev.renglones.desarrollo, -2_000_00n);
    const flujo = estadoDeResultados(credito, SEP, 'flujo');
    assert.equal(flujo.renglones.administracion, -1_000_00n);
    assert.equal(flujo.renglones.desarrollo, 0n);
    assert.equal(
      estadoDeResultados(credito, parsePeriodo('2026-10')!, 'flujo').renglones.administracion,
      -4_000_00n,
    );
  });

  it('estimates ISR on cash in both bases, as RESICO does', () => {
    const credito = [imp('ingresos', 10_000), imp('administracion', 4_000, '2026-09-30', null)];
    const dev = estadoDeResultados(credito, SEP, 'devengado');
    assert.equal(dev.renglones.utilidad_antes_impuestos, 6_000_00n);
    assert.equal(dev.renglones.isr_estimado, -3_000_00n);
    const perdida = estadoDeResultados([imp('administracion', 900)], SEP, 'flujo');
    assert.equal(perdida.renglones.isr_estimado, 0n);
  });

  it('nets a reversal, and a financial gain adds to the result', () => {
    const e = estadoDeResultados(
      [
        imp('ingresos', 2_000),
        imp('ventas_marketing', 600),
        imp('ventas_marketing', -600),
        imp('financiero', -50),
      ],
      SEP,
      'devengado',
    );
    assert.equal(e.renglones.ventas_marketing, 0n);
    assert.equal(e.renglones.financiero, 50_00n);
    assert.equal(e.movimientos.get('ventas_marketing')?.length, 2);
  });

  it('leaves out what falls outside the period', () => {
    const e = estadoDeResultados(
      [
        imp('ingresos', 100, '2026-08-31'),
        imp('ingresos', 200, '2026-10-01'),
        imp('ingresos', 300),
      ],
      SEP,
      'devengado',
    );
    assert.equal(e.renglones.ingresos, 300_00n);
  });
});

describe('importeDeLinea', () => {
  it('reads each account on its own side', () => {
    assert.equal(importeDeLinea('ingresos', 0n, 500n), 500n);
    assert.equal(importeDeLinea('ingresos', 500n, 0n), -500n);
    assert.equal(importeDeLinea('administracion', 700n, 0n), 700n);
    assert.equal(importeDeLinea('financiero', 0n, 90n), -90n);
  });

  it('refuses an account that is not in the income statement', () => {
    assert.throws(() => importeDeLinea('bancos', 1n, 0n), CuentaFueraDeResultadosError);
    assert.throws(() => importeDeLinea('isr_resultado', 1n, 0n), {
      code: 'CUENTA_FUERA_DE_RESULTADOS',
    });
  });
});
