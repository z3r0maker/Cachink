/**
 * Unit tests for BusinessForm state + ISR defaults wiring.
 */

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBusinessFormState, parseForm } from '../../src/screens/BusinessForm/business-form-state';
import type { IsrDefaults } from '@cachink/domain';

const mockIsrDefaults: IsrDefaults = {
  RIF: 0.02,
  RESICO: 0.0125,
  Asalariados: 0.25,
  Otro: 0.30,
};

describe('useBusinessFormState with ISR defaults', () => {
  it('uses ISR defaults for initial regime when no explicit defaults provided', () => {
    const { result } = renderHook(() =>
      useBusinessFormState({ isrDefaults: mockIsrDefaults }),
    );
    // Default regime is RIF → ISR should be 2 (= 0.02 * 100)
    expect(result.current.isrTasaPct).toBe('2');
  });

  it('uses explicit defaults.isrTasa over ISR defaults', () => {
    const { result } = renderHook(() =>
      useBusinessFormState({
        defaults: { isrTasa: 0.15, regimenFiscal: 'RIF' },
        isrDefaults: mockIsrDefaults,
      }),
    );
    expect(result.current.isrTasaPct).toBe('15');
  });

  it('auto-fills ISR when regime changes and ISR not manually edited', () => {
    const { result } = renderHook(() =>
      useBusinessFormState({ isrDefaults: mockIsrDefaults }),
    );
    expect(result.current.regimen).toBe('RIF');
    expect(result.current.isrTasaPct).toBe('2');

    act(() => {
      result.current.setRegimen('RESICO');
    });
    expect(result.current.regimen).toBe('RESICO');
    expect(result.current.isrTasaPct).toBe('1.25');

    act(() => {
      result.current.setRegimen('Asalariados');
    });
    expect(result.current.isrTasaPct).toBe('25');

    act(() => {
      result.current.setRegimen('Otro');
    });
    expect(result.current.isrTasaPct).toBe('30');
  });

  it('does NOT auto-fill ISR after manual edit', () => {
    const { result } = renderHook(() =>
      useBusinessFormState({ isrDefaults: mockIsrDefaults }),
    );

    // Manual edit
    act(() => {
      result.current.setIsrTasaPct('42');
    });
    expect(result.current.isrTasaPct).toBe('42');

    // Now change regime — should NOT override the manually edited value
    act(() => {
      result.current.setRegimen('RESICO');
    });
    expect(result.current.isrTasaPct).toBe('42');
  });

  it('falls back to ISR_DEFAULTS_SEED when no isrDefaults prop is provided', () => {
    const { result } = renderHook(() => useBusinessFormState(undefined));
    // Default regime is RIF → seed value is 0.02 → display "2"
    expect(result.current.isrTasaPct).toBe('2');
  });

  it('auto-fills from ISR_DEFAULTS_SEED when isrDefaults is undefined', () => {
    const { result } = renderHook(() => useBusinessFormState(undefined));
    act(() => {
      result.current.setRegimen('RESICO');
    });
    // Without explicit isrDefaults, falls back to the domain seed (1.25%)
    expect(result.current.isrTasaPct).toBe('1.25');

    act(() => {
      result.current.setRegimen('Otro');
    });
    expect(result.current.isrTasaPct).toBe('30');
  });
});

describe('parseForm', () => {
  it('accepts valid inputs', () => {
    const result = parseForm('Test Biz', 'RIF', '2', 'Required');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.isrTasa).toBeCloseTo(0.02, 10);
    }
  });

  it('rejects empty nombre', () => {
    const result = parseForm('', 'RIF', '30', 'Required');
    expect(result.ok).toBe(false);
  });

  it('rejects ISR above 100', () => {
    const result = parseForm('Test', 'RIF', '101', 'Required');
    expect(result.ok).toBe(false);
  });

  it('rejects ISR below 0', () => {
    const result = parseForm('Test', 'RIF', '-1', 'Required');
    expect(result.ok).toBe(false);
  });
});
