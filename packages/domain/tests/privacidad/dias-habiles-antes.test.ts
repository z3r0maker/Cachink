import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { restarDiasHabiles, sumarDiasHabiles, type IsoDate } from '../../src/index.js';

const d = (s: string) => s as IsoDate;

/**
 * Counting backwards (LFPC art. 76 Bis): the renewal reminder must leave at
 * least five días hábiles before the charge, so the cron needs the day that
 * many días hábiles before it.
 */
describe('restarDiasHabiles', () => {
  it('counts back from the day before, skipping weekends and rest days', () => {
    // Mon 21 Sep 2026 − 5: Fri 18, Thu 17, (Wed 16 off), Tue 15, Mon 14, Fri 11.
    assert.equal(restarDiasHabiles(d('2026-09-21'), 5), '2026-09-11');
  });

  it('is the inverse of sumarDiasHabiles from a día hábil', () => {
    assert.equal(sumarDiasHabiles(restarDiasHabiles(d('2026-12-28'), 6), 6), '2026-12-28');
  });

  it('crosses a year boundary and New Year', () => {
    // Mon 4 Jan 2027 − 2: Fri 1 Jan is a rest day, so Thu 31 Dec, Wed 30 Dec.
    assert.equal(restarDiasHabiles(d('2027-01-04'), 2), '2026-12-30');
  });

  it('refuses a count that is not a positive integer', () => {
    for (const n of [0, -2, 2.5, Number.NaN]) {
      assert.throws(() => restarDiasHabiles(d('2026-09-21'), n), RangeError);
    }
  });
});
