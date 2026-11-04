import assert from 'node:assert/strict';
import {
  estadoDeResultados,
  parsePeriodo,
  periodoAnterior,
  type ImporteResultados,
  type Periodo,
} from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import {
  hrefResumen,
  kpisDe,
  parseVistaResumen,
  puenteResumen,
} from '../src/server/empresa/resumen-view';

/** Resumen's tiles and «De dónde sale la utilidad» (E-16, board CD-12b). */
let n = 0;
const imp = (cuenta: ImporteResultados['cuenta'], pesos: number, fecha: string) => ({
  entryId: `r${++n}`,
  concepto: `Concepto ${n}`,
  cuenta,
  importe: BigInt(Math.round(pesos * 100)),
  fecha,
  fechaFlujo: fecha,
});

/** CD-12b's October against a September $450 smaller in income. */
const LIBRO: ImporteResultados[] = [
  imp('ingresos', 3_450, '2026-09-10'),
  imp('costo_servicio', 1_173, '2026-09-10'),
  imp('desarrollo', 12_500, '2026-09-12'),
  imp('ingresos', 3_900, '2026-10-10'),
  imp('costo_servicio', 1_482, '2026-10-10'),
  imp('ventas_marketing', 2_000, '2026-10-11'),
  imp('desarrollo', 12_500, '2026-10-12'),
  imp('administracion', 2_738, '2026-10-13'),
  imp('financiero', 140, '2026-10-14'),
];

const periodo = (clave: string): Periodo => {
  const p = parsePeriodo(clave);
  assert.ok(p);
  return p;
};

const estados = (clave: string, libro = LIBRO) => {
  const p = periodo(clave);
  return {
    actual: estadoDeResultados(libro, p, 'devengado'),
    anterior: estadoDeResultados(libro, periodoAnterior(p), 'devengado'),
  };
};

describe('parseVistaResumen and hrefResumen', () => {
  it('defaults to this month and keeps a valid period', () => {
    assert.equal(parseVistaResumen({}, '2026-10-15').clave, '2026-10');
    assert.equal(parseVistaResumen({ periodo: '2026-T3' }, '2026-10-15').clave, '2026-T3');
    assert.equal(parseVistaResumen({ periodo: 'basura' }, '2026-10-15').clave, '2026-10');
    assert.equal(hrefResumen(periodo('2026')), '/empresa?periodo=2026');
  });
});

describe('kpisDe', () => {
  it('draws the four tiles with their comparison and target', () => {
    const { actual, anterior } = estados('2026-10');
    const t = kpisDe(actual, anterior);
    assert.deepEqual(
      t.map((k) => [k.label, k.valor, k.cambio, k.tono]),
      [
        ['Ingresos netos', '$3,900', '+$450 vs septiembre', 'bien'],
        ['Margen bruto', '62 %', '−4 pts vs septiembre', 'mal'],
        ['EBITDA', '−$14,820', '−$4,597 vs septiembre', 'mal'],
        ['Utilidad neta', '−$14,960', '−$4,737 vs septiembre', 'mal'],
      ],
    );
    assert.equal(t[0]?.ref, 'Devengado: lo facturado en el mes');
    assert.equal(t[1]?.ref, 'Meta: 75 % o más');
    assert.equal(t[3]?.ref, 'Sin ISR: no hay utilidad');
    assert.equal(t[2]?.href, '/empresa/resultados?periodo=2026-10');
  });

  it('says «Sin datos» on every tile in a period without movements', () => {
    const { actual, anterior } = estados('2026-12');
    for (const k of kpisDe(actual, anterior)) {
      assert.equal(k.valor, 'Sin datos', k.label);
      assert.equal(k.cambio, 'Sin movimientos en diciembre', k.label);
      assert.equal(k.tono, 'igual');
    }
    assert.equal(kpisDe(actual, anterior)[3]?.ref, 'Después de ISR estimado');
  });

  it('gives no margin without costs captured, and names why', () => {
    const { actual, anterior } = estados('2026-10', [imp('ingresos', 1_000, '2026-10-10')]);
    const margen = kpisDe(actual, anterior)[1];
    assert.equal(margen?.valor, 'Sin datos');
    assert.equal(margen?.cambio, 'Sin gastos registrados en octubre');
  });

  it('compares a quarter with the one before', () => {
    const { actual, anterior } = estados('2026-T4');
    assert.equal(kpisDe(actual, anterior)[0]?.cambio, '+$450 vs T3 2026');
    assert.equal(kpisDe(actual, anterior)[0]?.ref, 'Devengado: lo facturado en el trimestre');
  });

  it('says «Igual que» when nothing moved', () => {
    const libro = [imp('ingresos', 100, '2026-09-10'), imp('ingresos', 100, '2026-10-10')];
    const { actual, anterior } = estados('2026-10', libro);
    assert.equal(kpisDe(actual, anterior)[0]?.cambio, 'Igual que septiembre');
  });
});

describe('puenteResumen', () => {
  it('lists income, each cost and the results, scaled to the costs’ total', () => {
    const { actual } = estados('2026-10');
    const p = puenteResumen(actual);
    assert.deepEqual(
      p.filas.map((f) => [f.label, f.valor, f.rol]),
      [
        ['Ingresos', '$3,900', 'ingreso'],
        ['Costo del servicio', '−$1,482', 'costoServicio'],
        ['Ventas y marketing', '−$2,000', 'ventasMarketing'],
        ['Desarrollo', '−$12,500', 'desarrollo'],
        ['Administración', '−$2,738', 'administracion'],
        ['EBITDA', '−$14,820', 'perdida'],
        ['Resultado financiero', '−$140', 'impuesto'],
        ['Utilidad neta', '−$14,960', 'perdida'],
      ],
    );
    assert.equal(p.filas[0]?.ancho, 20.8, '3,900 of the 18,720 the costs add up to');
    assert.equal(p.nota, 'Los costos de octubre suman $18,720: 4.8 veces los ingresos.');
  });

  it('draws nothing in an empty period and says so', () => {
    const p = puenteResumen(estados('2026-12').actual);
    assert.deepEqual(p.filas, []);
    assert.equal(p.nota, 'Sin ingresos ni gastos en diciembre.');
  });

  it('reads costs as a share of income when they are smaller', () => {
    const libro = [
      imp('ingresos', 10_000, '2026-10-10'),
      imp('administracion', 2_500, '2026-10-11'),
    ];
    const p = puenteResumen(estados('2026-10', libro).actual);
    assert.equal(p.nota, 'Los costos de octubre suman $2,500: 25 % de los ingresos.');
    assert.equal(p.filas.at(-1)?.rol, 'restante');
  });

  it('names costs without income', () => {
    const libro = [imp('administracion', 2_500, '2026-10-11')];
    assert.equal(
      puenteResumen(estados('2026-10', libro).actual).nota,
      'Los costos de octubre suman $2,500, sin ingresos.',
    );
  });
});
