import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  cabeEnMeses,
  enRango,
  finDeMeses,
  hoyEn,
  nombreDelMes,
  rangoDelMes,
  rangoDeSemana,
  rangoDelAnio,
  rangoDelTrimestre,
  sumarDias,
  ultimosDias,
  type IsoDate,
} from '../src/index.js';

const d = (s: string) => s as IsoDate;

describe('periodos', () => {
  it("today is the business's date in Mexico City, not UTC's", () => {
    // 03:00 UTC on the 13th is still the 12th in Mexico City (UTC-6).
    assert.equal(hoyEn(new Date('2026-05-13T03:00:00Z')), '2026-05-12');
    assert.equal(hoyEn(new Date('2026-05-13T07:00:00Z')), '2026-05-13');
  });

  it('a month runs from the 1st to its last day, leap years included', () => {
    assert.deepEqual(rangoDelMes(d('2026-05-12')), { desde: '2026-05-01', hasta: '2026-05-31' });
    assert.deepEqual(rangoDelMes(d('2028-02-10')), { desde: '2028-02-01', hasta: '2028-02-29' });
  });

  it('a week runs Monday to Sunday, across a month boundary too', () => {
    // 2026-05-12 is a Tuesday.
    assert.deepEqual(rangoDeSemana(d('2026-05-12')), { desde: '2026-05-11', hasta: '2026-05-17' });
    assert.deepEqual(rangoDeSemana(d('2026-06-01')), { desde: '2026-06-01', hasta: '2026-06-07' });
    assert.deepEqual(rangoDeSemana(d('2026-05-31')), { desde: '2026-05-25', hasta: '2026-05-31' });
  });

  it('names the month in Spanish, capitalised', () => {
    assert.equal(nombreDelMes(d('2026-05-12')), 'Mayo 2026');
    assert.equal(nombreDelMes(d('2026-09-01')), 'Septiembre 2026');
  });

  it('a date is in a range inclusively; a malformed one never is', () => {
    const r = { desde: d('2026-05-01'), hasta: d('2026-05-31') };
    assert.equal(enRango('2026-05-01', r), true);
    assert.equal(enRango('2026-05-31T23:59:00Z', r), true);
    assert.equal(enRango('2026-06-01', r), false);
    assert.equal(enRango('', r), false);
  });

  it('moves by days across a month and a year', () => {
    assert.equal(sumarDias(d('2026-05-01'), -1), '2026-04-30');
    assert.equal(sumarDias(d('2026-12-31'), 1), '2027-01-01');
  });

  it('the last 30 days end today and start 29 days before', () => {
    assert.deepEqual(ultimosDias(d('2026-05-12'), 30), {
      desde: '2026-04-13',
      hasta: '2026-05-12',
    });
  });

  it('a quarter is its three calendar months', () => {
    assert.deepEqual(rangoDelTrimestre(d('2026-05-12')), {
      desde: '2026-04-01',
      hasta: '2026-06-30',
    });
    assert.deepEqual(rangoDelTrimestre(d('2026-12-31')), {
      desde: '2026-10-01',
      hasta: '2026-12-31',
    });
    assert.deepEqual(rangoDelTrimestre(d('2026-01-01')), {
      desde: '2026-01-01',
      hasta: '2026-03-31',
    });
  });

  it('a year is the calendar (fiscal) year', () => {
    assert.deepEqual(rangoDelAnio(d('2026-05-12')), { desde: '2026-01-01', hasta: '2026-12-31' });
  });
});

describe('finDeMeses / cabeEnMeses — the Estados custom-range cap (DB3-EST-01)', () => {
  it('ends the day before the same date `meses` months on', () => {
    assert.equal(finDeMeses(d('2025-05-01'), 13), '2026-05-31');
    assert.equal(finDeMeses(d('2025-05-12'), 13), '2026-06-11');
    assert.equal(finDeMeses(d('2026-01-01'), 1), '2026-01-31');
  });

  it('clamps a start day the target month lacks before stepping back', () => {
    assert.equal(finDeMeses(d('2025-01-31'), 13), '2026-02-27');
    assert.equal(finDeMeses(d('2027-01-31'), 13), '2028-02-28');
  });

  it('refuses a count of months that is not a positive integer', () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      assert.throws(() => finDeMeses(d('2026-01-01'), bad), RangeError, String(bad));
    }
  });

  it('accepts a range up to and including 13 months', () => {
    assert.equal(cabeEnMeses({ desde: d('2025-05-01'), hasta: d('2026-05-31') }, 13), true);
    assert.equal(cabeEnMeses({ desde: d('2026-05-12'), hasta: d('2026-05-12') }, 13), true);
  });

  it('refuses a range a day past 13 months, years long, or backwards', () => {
    assert.equal(cabeEnMeses({ desde: d('2025-05-01'), hasta: d('2026-06-01') }, 13), false);
    assert.equal(cabeEnMeses({ desde: d('2000-01-01'), hasta: d('2099-12-31') }, 13), false);
    assert.equal(cabeEnMeses({ desde: d('2026-05-12'), hasta: d('2026-05-11') }, 13), false);
  });
});
