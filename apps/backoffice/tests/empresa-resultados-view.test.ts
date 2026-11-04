import assert from 'node:assert/strict';
import {
  estadoDeResultados,
  parsePeriodo,
  puenteEbitda,
  tendencia,
  type ImporteResultados,
} from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import { cascada, puente, tendenciaGrafica } from '../src/server/empresa/resultados-graficas';
import {
  filasEstado,
  hrefResultados,
  monto,
  movimientosDe,
  nombrePeriodo,
  parseVista,
} from '../src/server/empresa/resultados-view';

/** Resultados' view (E-12, board CD-07): the URL, the rows and the charts' geometry. */
let n = 0;
const imp = (
  cuenta: ImporteResultados['cuenta'],
  pesos: number,
  fecha: string,
  fechaFlujo: string | null = fecha,
): ImporteResultados => ({
  entryId: `r${++n}`,
  concepto: `Concepto ${n}`,
  cuenta,
  importe: BigInt(pesos * 100),
  fecha,
  fechaFlujo,
});

const LIBRO = [
  imp('ingresos', 34_300, '2026-08-10'),
  imp('costo_servicio', 6_900, '2026-08-10'),
  imp('ingresos', 38_400, '2026-09-10'),
  imp('costo_servicio', 7_300, '2026-09-12'),
  imp('administracion', 4_000, '2026-09-03', null),
];
const SEP = parsePeriodo('2026-09')!;
const AGO = parsePeriodo('2026-08')!;

describe('parseVista y hrefResultados', () => {
  it('opens on this month, devengado, nothing open', () => {
    const v = parseVista({}, '2026-10-30');
    assert.deepEqual([v.periodo.clave, v.base, v.abrir], ['2026-10', 'devengado', null]);
  });

  it('keeps a valid choice and drops a made-up one', () => {
    const v = parseVista({ periodo: '2026-T3', base: 'flujo', abrir: 'desarrollo' }, '2026-10-30');
    assert.deepEqual([v.periodo.clave, v.base, v.abrir], ['2026-T3', 'flujo', 'desarrollo']);
    const raro = parseVista({ periodo: '2026-99', base: 'otro', abrir: 'bancos' }, '2026-10-30');
    assert.deepEqual([raro.periodo.clave, raro.base, raro.abrir], ['2026-10', 'devengado', null]);
  });

  it('writes the URL back with only what differs from the default', () => {
    const v = parseVista({ periodo: '2026-09' }, '2026-10-30');
    assert.equal(hrefResultados(v), '/empresa/resultados?periodo=2026-09');
    assert.equal(
      hrefResultados(v, { base: 'flujo', abrir: 'ingresos' }),
      '/empresa/resultados?periodo=2026-09&base=flujo&abrir=ingresos',
    );
  });

  it('names each kind of period', () => {
    assert.equal(nombrePeriodo(SEP), 'Septiembre de 2026');
    assert.equal(nombrePeriodo(parsePeriodo('2026-T3')!), '3.er trimestre de 2026');
    assert.equal(nombrePeriodo(parsePeriodo('2026')!), '2026');
  });
});

describe('filasEstado', () => {
  const sep = estadoDeResultados(LIBRO, SEP, 'devengado');
  const ago = estadoDeResultados(LIBRO, AGO, 'devengado');

  it('lists the cascade in order, negatives in parentheses, with the change toned', () => {
    const filas = filasEstado(sep, ago);
    assert.equal(filas.length, 13);
    assert.equal(filas[0]?.label, 'Ingresos netos (sin IVA)');
    const costo = filas.find((f) => f.id === 'costo_servicio')!;
    assert.deepEqual(
      [costo.actual, costo.anterior, costo.cambio, costo.tono, costo.negativo],
      ['($7,300.00)', '($6,900.00)', '−$400.00', 'mal', true],
    );
    assert.equal(filas.find((f) => f.id === 'ingresos')?.tono, 'bien');
    assert.equal(filas.find((f) => f.id === 'utilidad_bruta')?.pct, '81.0 %');
    assert.equal(filas.find((f) => f.id === 'ebitda')?.cuenta, null);
  });

  it('says «Sin datos» for every share when there is no income', () => {
    const vacio = estadoDeResultados([], SEP, 'devengado');
    assert.ok(filasEstado(vacio, vacio).every((f) => f.pct === 'Sin datos'));
    assert.equal(monto(0n), '$0.00');
  });

  it('opens a line into its movements, dated by the basis on screen', () => {
    const flujo = estadoDeResultados(LIBRO, SEP, 'flujo');
    assert.deepEqual(movimientosDe(flujo, 'administracion'), []);
    const [mv] = movimientosDe(sep, 'administracion');
    assert.deepEqual([mv?.fecha, mv?.monto], ['2026-09-03', '($4,000.00)']);
  });
});

describe('the charts', () => {
  it('draws the cascade inside its chart, totals from the axis', () => {
    const barras = cascada(estadoDeResultados(LIBRO, SEP, 'devengado'));
    assert.equal(barras.length, 11);
    assert.ok(barras.every((b) => b.desde >= 0 && b.desde + b.alto <= 100.01));
    assert.deepEqual(
      barras.filter((b) => b.total).map((b) => b.desde),
      [0, 0, 0, 0],
    );
    assert.equal(barras[0]?.alto, 100);
  });

  it('draws a loss below where the axis sits, still inside the chart', () => {
    const barras = cascada(
      estadoDeResultados([imp('administracion', 500, '2026-09-01')], SEP, 'devengado'),
    );
    assert.ok(barras.every((b) => b.desde >= 0 && b.desde + b.alto <= 100.01));
    assert.equal(barras.at(-1)?.valor, '−$500');
    assert.equal(barras[0]?.nota, 'Sin datos');
  });

  it('walks the bridge with signs on each step', () => {
    const p = puenteEbitda(
      estadoDeResultados(LIBRO, SEP, 'devengado'),
      estadoDeResultados(LIBRO, AGO, 'devengado'),
    );
    const pasos = puente(p, 'agosto', 'septiembre');
    assert.deepEqual(
      pasos.map((s) => [s.label, s.valor, s.rol]),
      [
        ['EBITDA agosto', '$27,400', 'restante'],
        ['Ingresos netos (sin IVA)', '+$4,100', 'ingreso'],
        ['Costo del servicio', '−$400', 'perdida'],
        ['Administración', '−$4,000', 'perdida'],
        ['EBITDA septiembre', '$27,100', 'restante'],
      ],
    );
  });

  it('scales six months to the tallest bar and names a month without data', () => {
    const meses = tendenciaGrafica(tendencia(LIBRO, '2026-09', 6, 'devengado'));
    assert.deepEqual(
      meses.map((mes) => mes.label),
      ['abr', 'may', 'jun', 'jul', 'ago', 'sep'],
    );
    assert.equal(meses[5]?.ingresos, 100);
    assert.equal(meses[0]?.margen, 'Sin datos');
    assert.equal(meses[4]?.margen, '80 %');
  });
});
