/**
 * deriveRange + defaultPeriodoState tests (Slice 3 C9).
 */

import { describe, expect, it } from 'vitest';
import { defaultPeriodoState, deriveRange } from '../../src/hooks/use-periodo-range';

describe('deriveRange', () => {
  it('mensual: expands YYYY-MM to first and last days of that month', () => {
    expect(deriveRange({ mode: 'mensual', year: '2026', month: '04', from: '', to: '' })).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
    });
  });

  it('mensual: handles 31-day months', () => {
    expect(deriveRange({ mode: 'mensual', year: '2026', month: '03', from: '', to: '' })).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });

  it('mensual: handles non-leap February', () => {
    expect(deriveRange({ mode: 'mensual', year: '2025', month: '02', from: '', to: '' })).toEqual({
      from: '2025-02-01',
      to: '2025-02-28',
    });
  });

  it('mensual: handles leap February', () => {
    expect(deriveRange({ mode: 'mensual', year: '2024', month: '02', from: '', to: '' })).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
  });

  it('anual: expands YYYY to first and last days of the year', () => {
    expect(deriveRange({ mode: 'anual', year: '2026', month: '', from: '', to: '' })).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });

  it('rango: passes through from/to when ordered', () => {
    expect(
      deriveRange({
        mode: 'rango',
        year: '',
        month: '',
        from: '2026-04-01',
        to: '2026-04-15',
      }),
    ).toEqual({ from: '2026-04-01', to: '2026-04-15' });
  });

  it('rango: clamps to === from when to < from', () => {
    expect(
      deriveRange({
        mode: 'rango',
        year: '',
        month: '',
        from: '2026-04-15',
        to: '2026-04-01',
      }),
    ).toEqual({ from: '2026-04-15', to: '2026-04-15' });
  });
});

describe('defaultPeriodoState', () => {
  it('seeds mensual mode for the current UTC month', () => {
    const state = defaultPeriodoState(new Date('2026-04-24T12:00:00Z'));
    expect(state.mode).toBe('mensual');
    expect(state.year).toBe('2026');
    expect(state.month).toBe('04');
    expect(state.from).toBe('2026-04-01');
    expect(state.to).toBe('2026-04-30');
  });
});
