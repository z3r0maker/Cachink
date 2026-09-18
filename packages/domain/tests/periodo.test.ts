import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  enRango,
  hoyEn,
  nombreDelMes,
  rangoDelMes,
  rangoDeSemana,
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
});
