/**
 * Fiscal period helpers — months are counted in Mexico City time.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { fiscalPeriodOf, parseFiscalPeriod } from '../../src/cfdi/index.js';

describe('fiscalPeriodOf', () => {
  it('uses Mexico City time, not UTC', () => {
    // 2026-10-01T03:00Z is still 30 Sep 21:00 in CDMX.
    assert.equal(fiscalPeriodOf(new Date('2026-10-01T03:00:00Z')), '2026-09');
    assert.equal(fiscalPeriodOf(new Date('2026-10-01T06:00:00Z')), '2026-10');
    assert.equal(fiscalPeriodOf(new Date('2027-01-01T05:59:59Z')), '2026-12');
  });

  it('rejects an invalid date', () => {
    assert.throws(() => fiscalPeriodOf(new Date('nope')), { code: 'CFDI_INVALID_PERIOD' });
  });
});

describe('parseFiscalPeriod', () => {
  it('returns SAT month code, year and the CDMX end instant', () => {
    const p = parseFiscalPeriod('2026-12');
    assert.equal(p.meses, '12');
    assert.equal(p.anio, 2026);
    assert.equal(p.endsAt.toISOString(), '2027-01-01T06:00:00.000Z');
  });

  it('rejects malformed periods', () => {
    for (const bad of ['2026-13', '2026-00', '26-09', '2026-9', '', '1999-01']) {
      assert.throws(() => parseFiscalPeriod(bad), { code: 'CFDI_INVALID_PERIOD' }, bad);
    }
  });
});
