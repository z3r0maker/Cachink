import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  crecimiento,
  dineroDelRango,
  rangoDelResumen,
  trimestresHasta,
} from '../../src/corp/trimestre/index.js';

/** E-17 (board CD-17b): the quarter at a glance, against the one before. */
describe('crecimiento', () => {
  it('is the change against the previous figure, rounded', () => {
    assert.equal(crecimiento(102_800_00n, 66_500_00n), 55);
    assert.equal(crecimiento(66_500_00n, 35_500_00n), 87);
    assert.equal(crecimiento(50_00n, 100_00n), -50);
  });

  it('has no base when the previous one was zero or a loss', () => {
    assert.equal(crecimiento(35_500_00n, 0n), null);
    assert.equal(crecimiento(10_00n, -5_00n), null);
  });
});

describe('trimestresHasta', () => {
  it('lists the last n quarters, oldest first', () => {
    assert.deepEqual(trimestresHasta('2026-T3', 4), ['2025-T4', '2026-T1', '2026-T2', '2026-T3']);
  });
});

describe('rangoDelResumen', () => {
  it('a closed quarter runs to its last day', () => {
    assert.deepEqual(rangoDelResumen('2026-T3', '2026-11-20'), {
      desde: '2026-07-01',
      hasta: '2026-09-30',
      estado: 'cerrado',
    });
  });

  it('the quarter in progress runs to today', () => {
    assert.deepEqual(rangoDelResumen('2026-T4', '2026-11-20'), {
      desde: '2026-10-01',
      hasta: '2026-11-20',
      estado: 'en_curso',
    });
  });

  it('a quarter still to come has no range', () => {
    assert.equal(rangoDelResumen('2027-T1', '2026-11-20').estado, 'futuro');
  });
});

describe('dineroDelRango', () => {
  const movs = [
    { fecha: '2026-07-05', importe: 10_000_00n, socios: true, kind: 'ajuste' },
    { fecha: '2026-07-05', importe: 10_000_00n, socios: true, kind: 'ajuste' },
    { fecha: '2026-08-17', importe: -4_200_00n, socios: false, kind: 'pago_impuestos' },
    { fecha: '2026-09-01', importe: -2_000_00n, socios: true, kind: 'ajuste' },
    { fecha: '2026-10-02', importe: 5_000_00n, socios: true, kind: 'ajuste' },
    { fecha: '2026-09-10', importe: 9_000_00n, socios: false, kind: 'cobro' },
  ] as const;

  it("adds the partners' money in and the taxes paid inside the range", () => {
    assert.deepEqual(dineroDelRango(movs, '2026-07-01', '2026-09-30'), {
      aportado: 20_000_00n,
      impuestos: 4_200_00n,
    });
  });

  it('a refund to a partner is not money put in', () => {
    assert.equal(dineroDelRango(movs, '2026-09-01', '2026-09-30').aportado, 0n);
  });
});
