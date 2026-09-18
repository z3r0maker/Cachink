import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  InvalidUsageDateError,
  InvalidUsagePeriodError,
  InvalidUsageTimeZoneError,
  isUsagePeriod,
  nextUsagePeriod,
  usagePeriod,
} from '../../src/usage/index.js';

describe('usagePeriod', () => {
  it('returns the business-local month in Mexico City by default', () => {
    assert.equal(usagePeriod(new Date('2026-09-15T12:00:00.000Z')), '2026-09');
    assert.equal(usagePeriod('2026-09-15T12:00:00.000Z'), '2026-09');
  });

  it('keeps a late-night sale on the last day of the month in that month', () => {
    // 23:30 on 31 Aug in CDMX (UTC-6) is 05:30 UTC on 1 Sep.
    assert.equal(usagePeriod('2026-09-01T05:30:00.000Z'), '2026-08');
  });

  it('rolls the year over at local midnight, not UTC midnight', () => {
    assert.equal(usagePeriod('2027-01-01T05:59:59.000Z'), '2026-12');
    assert.equal(usagePeriod('2027-01-01T06:00:00.000Z'), '2027-01');
  });

  it('honours another time zone, including DST zones, via Intl', () => {
    assert.equal(usagePeriod('2026-09-01T05:30:00.000Z', 'UTC'), '2026-09');
    // Tijuana observes DST (UTC-7 in summer).
    assert.equal(usagePeriod('2026-07-01T06:30:00.000Z', 'America/Tijuana'), '2026-06');
    assert.equal(usagePeriod('2026-07-01T07:30:00.000Z', 'America/Tijuana'), '2026-07');
  });

  it('rejects an invalid date with a typed error', () => {
    assert.throws(() => usagePeriod('not a date'), InvalidUsageDateError);
    assert.throws(() => usagePeriod(new Date(Number.NaN)), InvalidUsageDateError);
  });

  it('rejects an unknown time zone with a typed error', () => {
    assert.throws(() => usagePeriod(new Date(), 'Mars/Olympus'), InvalidUsageTimeZoneError);
  });
});

describe('period helpers', () => {
  it('recognises valid periods only', () => {
    assert.equal(isUsagePeriod('2026-09'), true);
    assert.equal(isUsagePeriod('2026-13'), false);
    assert.equal(isUsagePeriod('2026-9'), false);
    assert.equal(isUsagePeriod('2026-00'), false);
  });

  it('advances a period, rolling over December', () => {
    assert.equal(nextUsagePeriod('2026-09'), '2026-10');
    assert.equal(nextUsagePeriod('2026-12'), '2027-01');
  });

  it('rejects a malformed period', () => {
    assert.throws(() => nextUsagePeriod('2026-13'), InvalidUsagePeriodError);
  });
});
