import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPeriodOpen,
  convertirAMxn,
  PeriodoCerradoError,
  periodOf,
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

describe('periodOf', () => {
  it('gives the month of a real date, the last day of every month included', () => {
    for (const [fecha, mes] of [
      ['2026-01-31', '2026-01'],
      ['2026-02-28', '2026-02'],
      ['2028-02-29', '2028-02'],
      ['2026-04-30', '2026-04'],
      ['2026-11-30', '2026-11'],
      ['2026-12-31', '2026-12'],
    ] as const) {
      assert.equal(periodOf(fecha), mes, fecha);
    }
  });

  it('refuses a day past the end of a 30-day month', () => {
    for (const bad of ['2026-04-31', '2026-06-31', '2026-09-31', '2026-11-31']) {
      assert.equal(periodOf(bad), null, bad);
    }
  });

  it('refuses 29 February outside a leap year, and 30 February always', () => {
    for (const bad of ['2026-02-29', '2100-02-29', '2026-02-30', '2028-02-30']) {
      assert.equal(periodOf(bad), null, bad);
    }
  });

  it('refuses a month or day out of range, and anything not YYYY-MM-DD', () => {
    for (const bad of ['2026-13-01', '2026-00-10', '2026-10-00', '2026-10-32', '2026-1-05', '']) {
      assert.equal(periodOf(bad), null, bad);
    }
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

  it("refuses an open month's day that the month does not have", () => {
    for (const bad of ['2026-11-31', '2026-02-29', '2026-02-30']) {
      assert.throws(() => assertPeriodOpen(bad, closed), PeriodoCerradoError, bad);
    }
  });

  it('lets 29 February in when the year is a leap year', () => {
    assert.doesNotThrow(() => assertPeriodOpen('2028-02-29', closed));
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
