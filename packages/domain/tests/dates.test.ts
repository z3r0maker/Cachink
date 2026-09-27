import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';

import { esIsoDate, parseIsoDate, today, now, yearMonth, year } from '../src/dates/index.js';

describe('parseIsoDate', () => {
  it('accepts a valid YYYY-MM-DD date', () => {
    expect(parseIsoDate('2026-04-23')).toBe('2026-04-23');
  });

  it('rejects missing zero-padding', () => {
    expect(() => parseIsoDate('2026-4-23')).toThrow(TypeError);
  });

  it('rejects timestamps', () => {
    expect(() => parseIsoDate('2026-04-23T10:00:00Z')).toThrow(TypeError);
  });

  it('rejects an empty string', () => {
    expect(() => parseIsoDate('')).toThrow(TypeError);
  });

  it('rejects obviously invalid dates like 2026-13-01', () => {
    expect(() => parseIsoDate('2026-13-01')).toThrow(TypeError);
  });

  // R3-14: `Date` rolls these over into the next month instead of failing.
  it('rejects a day the month does not have, which Date would roll over', () => {
    for (const bad of ['2026-02-30', '2026-02-29', '2026-04-31', '2026-06-31', '2026-01-32']) {
      assert.throws(() => parseIsoDate(bad), TypeError, bad);
    }
  });

  it('accepts the last day of every month, and 29 February in a leap year', () => {
    for (const ok of ['2026-01-31', '2026-02-28', '2028-02-29', '2026-04-30', '2026-12-31']) {
      assert.equal(parseIsoDate(ok), ok);
    }
  });
});

describe('esIsoDate', () => {
  it('is parseIsoDate as a predicate', () => {
    assert.equal(esIsoDate('2026-05-12'), true);
    for (const bad of ['2026-02-30', '2026-5-12', '', null, undefined, '2026-05-12T00:00:00Z']) {
      assert.equal(esIsoDate(bad), false, String(bad));
    }
  });
});

describe('today', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('now', () => {
  it('returns an ISO 8601 timestamp', () => {
    expect(now()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('yearMonth', () => {
  it('extracts YYYY-MM prefix', () => {
    expect(yearMonth(parseIsoDate('2026-04-23'))).toBe('2026-04');
  });
});

describe('year', () => {
  it('extracts YYYY prefix', () => {
    expect(year(parseIsoDate('2026-04-23'))).toBe('2026');
  });
});
