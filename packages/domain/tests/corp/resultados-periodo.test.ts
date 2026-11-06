import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  enPeriodo,
  mesesDe,
  mesesHasta,
  parsePeriodo,
  periodoAnterior,
  periodoDe,
} from '../../src/corp/resultados/index.js';

/** E-12: Resultados reads a month, a quarter or a year, against the one before. */
describe('periodos de Resultados', () => {
  it('reads a month, a quarter and a year with their first and last day', () => {
    assert.deepEqual(parsePeriodo('2026-09'), {
      tipo: 'mes',
      clave: '2026-09',
      desde: '2026-09-01',
      hasta: '2026-09-30',
    });
    assert.deepEqual(parsePeriodo('2026-T1'), {
      tipo: 'trimestre',
      clave: '2026-T1',
      desde: '2026-01-01',
      hasta: '2026-03-31',
    });
    assert.deepEqual(parsePeriodo('2028'), {
      tipo: 'anio',
      clave: '2028',
      desde: '2028-01-01',
      hasta: '2028-12-31',
    });
    assert.equal(parsePeriodo('2028-02')?.hasta, '2028-02-29');
  });

  it('refuses a key that names no period', () => {
    for (const k of ['', '2026-13', '2026-00', '2026-T5', '2026-T0', '26-09', '2026-9', 'x']) {
      assert.equal(parsePeriodo(k), null, k);
    }
  });

  it('finds the period of a day', () => {
    assert.equal(periodoDe('mes', '2026-10-30').clave, '2026-10');
    assert.equal(periodoDe('trimestre', '2026-10-30').clave, '2026-T4');
    assert.equal(periodoDe('anio', '2026-10-30').clave, '2026');
  });

  it('steps back across a year boundary', () => {
    assert.equal(periodoAnterior(periodoDe('mes', '2026-01-15')).clave, '2025-12');
    assert.equal(periodoAnterior(periodoDe('trimestre', '2026-02-01')).clave, '2025-T4');
    assert.equal(periodoAnterior(periodoDe('anio', '2026-02-01')).clave, '2025');
  });

  it('lists its months and the months that end at one', () => {
    assert.deepEqual(mesesDe(parsePeriodo('2026-T4')!), ['2026-10', '2026-11', '2026-12']);
    assert.deepEqual(mesesHasta('2026-02', 3), ['2025-12', '2026-01', '2026-02']);
    assert.equal(mesesDe(parsePeriodo('2026')!).length, 12);
  });

  it('tells whether a day falls inside, edges included', () => {
    const t3 = parsePeriodo('2026-T3')!;
    assert.equal(enPeriodo('2026-07-01', t3), true);
    assert.equal(enPeriodo('2026-09-30', t3), true);
    assert.equal(enPeriodo('2026-10-01', t3), false);
    assert.equal(enPeriodo('2026-06-30', t3), false);
  });
});
