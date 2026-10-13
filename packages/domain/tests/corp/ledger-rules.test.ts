import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPeriodOpen,
  convertirAMxn,
  PeriodoCerradoError,
  postMovement,
  reverseLines,
  sumDebe,
  sumHaber,
  TipoCambioInvalidoError,
} from '../../src/corp/ledger/index.js';

/** E-02's other rules: reversals, the period lock, and USD charges. */
describe('reverseLines', () => {
  it('nets an entry to zero against itself', () => {
    const lines = postMovement({ kind: 'prestamo_socio', socio: 2, monto: 5_000_00n });
    const both = [...lines, ...reverseLines(lines)];
    for (const cuenta of ['bancos', 'prestamos_socios']) {
      const mine = both.filter((l) => l.cuenta === cuenta);
      assert.equal(sumDebe(mine), sumHaber(mine), cuenta);
    }
  });

  it('keeps the partner on a reversed partner line', () => {
    const lines = postMovement({ kind: 'prestamo_socio', socio: 2, monto: 5_000_00n });
    assert.equal(reverseLines(lines)[1]?.socio, 2);
  });
});

describe('assertPeriodOpen', () => {
  const closed = new Set(['2026-08', '2026-09']);

  it('lets an entry into an open month', () => {
    assert.doesNotThrow(() => assertPeriodOpen('2026-10-08', closed));
  });

  it('refuses an entry dated in a closed month', () => {
    assert.throws(() => assertPeriodOpen('2026-09-30', closed), PeriodoCerradoError);
  });

  it('refuses a date that is not YYYY-MM-DD', () => {
    assert.throws(() => assertPeriodOpen('30/09/2026', closed), PeriodoCerradoError);
  });
});

describe('convertirAMxn', () => {
  it('converts USD centavos at the day rate, rounding half up to the centavo', () => {
    assert.equal(convertirAMxn(20_00n, '18.42'), 368_40n);
    assert.equal(convertirAMxn(29_00n, '18.4217'), 534_23n);
    assert.equal(convertirAMxn(1n, '18.425'), 18n);
  });

  it('refuses a rate that is zero, negative or not a decimal', () => {
    for (const bad of ['0', '-18.42', 'abc', '18.4.2', '']) {
      assert.throws(() => convertirAMxn(20_00n, bad), TipoCambioInvalidoError, bad);
    }
  });

  it('refuses a non-positive amount', () => {
    assert.throws(() => convertirAMxn(0n, '18.42'));
  });
});
