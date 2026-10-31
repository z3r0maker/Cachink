import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  estadoDeResultados,
  parsePeriodo,
  puenteEbitda,
  tendencia,
  type ImporteResultados,
} from '../../src/corp/resultados/index.js';

let n = 0;
const imp = (
  cuenta: ImporteResultados['cuenta'],
  pesos: number,
  fecha: string,
): ImporteResultados => ({
  entryId: `v${++n}`,
  concepto: cuenta,
  cuenta,
  importe: BigInt(pesos * 100),
  fecha,
  fechaFlujo: fecha,
});

/** Board CD-07's bridge: August 13,000 → September 13,450. */
const LIBRO: readonly ImporteResultados[] = [
  imp('ingresos', 34_300, '2026-08-10'),
  imp('costo_servicio', 6_900, '2026-08-10'),
  imp('ventas_marketing', 6_000, '2026-08-10'),
  imp('desarrollo', 4_400, '2026-08-10'),
  imp('administracion', 4_000, '2026-08-10'),
  imp('ingresos', 38_400, '2026-09-10'),
  imp('costo_servicio', 7_300, '2026-09-10'),
  imp('ventas_marketing', 9_000, '2026-09-10'),
  imp('desarrollo', 4_400, '2026-09-10'),
  imp('administracion', 4_250, '2026-09-10'),
];

const de = (clave: string) => estadoDeResultados(LIBRO, parsePeriodo(clave)!, 'devengado');

describe('¿Por qué cambió el EBITDA?', () => {
  it('walks from the previous EBITDA to this one, leaving out what did not move', () => {
    const p = puenteEbitda(de('2026-09'), de('2026-08'));
    assert.equal(p.inicio, 13_000_00n);
    assert.equal(p.fin, 13_450_00n);
    assert.deepEqual(
      p.pasos.map((s) => [s.id, s.importe]),
      [
        ['ingresos', 4_100_00n],
        ['costo_servicio', -400_00n],
        ['ventas_marketing', -3_000_00n],
        ['administracion', -250_00n],
      ],
    );
    assert.equal(p.inicio + p.pasos.reduce((a, s) => a + s.importe, 0n), p.fin);
  });

  it('has no steps when nothing changed', () => {
    assert.deepEqual(puenteEbitda(de('2026-07'), de('2026-06')).pasos, []);
  });
});

describe('tendencia de 6 meses', () => {
  it('gives each month its income, its costs by category and its EBITDA margin', () => {
    const t = tendencia(LIBRO, '2026-09', 6, 'devengado');
    assert.deepEqual(
      t.map((m) => m.mes),
      ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
    );
    const sep = t[5]!;
    assert.equal(sep.ingresos, 38_400_00n);
    assert.equal(sep.costos.ventas_marketing, 9_000_00n);
    assert.equal(sep.margenEbitda, 3_502);
    assert.equal(t[0]!.margenEbitda, null);
  });

  it('refuses a length that is not a whole number of months', () => {
    assert.throws(() => tendencia(LIBRO, '2026-09', 0, 'devengado'), { code: 'MONTO_INVALIDO' });
  });
});
