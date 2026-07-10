/**
 * useCorteGate + computeCorteGate tests.
 *
 * Pure time-based computation — no providers needed.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { computeCorteGate, useCorteGate } from '../../src/hooks/use-corte-gate';

describe('computeCorteGate', () => {
  it('shouldShow=true when hour >= 18 (default threshold)', () => {
    const result = computeCorteGate({
      now: () => new Date('2026-05-16T18:00:00'),
    });
    expect(result.shouldShow).toBe(true);
  });

  it('shouldShow=false when hour < 18', () => {
    const result = computeCorteGate({
      now: () => new Date('2026-05-16T17:59:59'),
    });
    expect(result.shouldShow).toBe(false);
  });

  it('shouldShow=true late at night (23:00)', () => {
    const result = computeCorteGate({
      now: () => new Date('2026-05-16T23:00:00'),
    });
    expect(result.shouldShow).toBe(true);
  });

  it('shouldShow=false early morning (08:00)', () => {
    const result = computeCorteGate({
      now: () => new Date('2026-05-16T08:00:00'),
    });
    expect(result.shouldShow).toBe(false);
  });

  it('respects custom threshold', () => {
    const result = computeCorteGate({
      threshold: 12,
      now: () => new Date('2026-05-16T12:00:00'),
    });
    expect(result.shouldShow).toBe(true);
  });

  it('custom threshold rejects earlier hours', () => {
    const result = computeCorteGate({
      threshold: 12,
      now: () => new Date('2026-05-16T11:59:00'),
    });
    expect(result.shouldShow).toBe(false);
  });
});

describe('useCorteGate', () => {
  it('returns shouldShow from memoized computation', () => {
    const { result } = renderHook(() =>
      useCorteGate({ now: () => new Date('2026-05-16T20:00:00') }),
    );
    expect(result.current.shouldShow).toBe(true);
  });

  it('uses default threshold of 18', () => {
    const { result } = renderHook(() =>
      useCorteGate({ now: () => new Date('2026-05-16T17:00:00') }),
    );
    expect(result.current.shouldShow).toBe(false);
  });
});
