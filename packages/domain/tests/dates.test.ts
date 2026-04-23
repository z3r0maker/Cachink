import { describe, it, expect } from 'vitest';
import { parseIsoDate, today, now, yearMonth, year } from '../src/dates/index.js';

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
