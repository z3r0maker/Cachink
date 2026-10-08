import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  anteriorDiaHabil,
  diasInhabiles,
  esDiaHabil,
  FechaInvalidaError,
  siguienteDiaHabil,
  sumarDiasHabiles,
} from '../../src/corp/index.js';

/** E-04: business days as CFF art. 12 counts them. */
describe('diasInhabiles', () => {
  it('lists the fixed and the Monday holidays of a year', () => {
    const d = diasInhabiles(2026);
    for (const f of [
      '2026-01-01',
      '2026-02-02', // first Monday of February
      '2026-03-16', // third Monday of March
      '2026-05-01',
      '2026-05-05',
      '2026-09-16',
      '2026-11-16', // third Monday of November
      '2026-12-25',
    ]) {
      assert.ok(d.has(f), f);
    }
    assert.equal(d.has('2026-10-01'), false);
  });

  it('adds the transfer of the federal executive every six years', () => {
    assert.ok(diasInhabiles(2030).has('2030-10-01'));
  });
});

describe('business days', () => {
  it('moves a 17th on a Saturday to Monday the 19th', () => {
    assert.equal(esDiaHabil('2026-10-17'), false);
    assert.equal(siguienteDiaHabil('2026-10-17'), '2026-10-19');
  });

  it('jumps a holiday that follows a weekend', () => {
    // Saturday 14 Nov → Monday 16 is the Revolution holiday → Tuesday 17.
    assert.equal(siguienteDiaHabil('2026-11-14'), '2026-11-17');
  });

  it('keeps a business day as it is, and steps back for «during the month»', () => {
    assert.equal(siguienteDiaHabil('2026-10-19'), '2026-10-19');
    assert.equal(anteriorDiaHabil('2027-03-31'), '2027-03-31');
    assert.equal(anteriorDiaHabil('2024-03-31'), '2024-03-29');
  });

  it('counts business days after an event', () => {
    // Friday 2 Oct 2026 + 15 business days → Friday 23 Oct.
    assert.equal(sumarDiasHabiles('2026-10-02', 15), '2026-10-23');
  });

  it('refuses what is not a date', () => {
    assert.throws(() => siguienteDiaHabil('2026-02-30'), FechaInvalidaError);
    assert.throws(() => esDiaHabil('mañana'), FechaInvalidaError);
  });
});
