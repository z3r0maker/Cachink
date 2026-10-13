/**
 * useNumpadInput tests — verifies display format always shows
 * 2 decimal places and centavo conversion is correct.
 */

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNumpadInput } from '../../src/components/Numpad/use-numpad-input';

describe('useNumpadInput — display format', () => {
  it('shows $0.00 when empty', () => {
    const { result } = renderHook(() => useNumpadInput());
    expect(result.current.display).toBe('$0.00');
  });

  it('shows 2 decimal places for whole numbers', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.onKey('5');
      result.current.onKey('0');
      result.current.onKey('0');
    });
    expect(result.current.display).toBe('$500.00');
  });

  it('pads partial decimal input to 2 places', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.onKey('5');
      result.current.onKey('.');
      result.current.onKey('1');
    });
    expect(result.current.display).toBe('$5.10');
  });

  it('shows exact 2 decimal places when fully specified', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.onKey('1');
      result.current.onKey('2');
      result.current.onKey('.');
      result.current.onKey('3');
      result.current.onKey('4');
    });
    expect(result.current.display).toBe('$12.34');
  });

  it('shows $0.00 for "0." (decimal just started)', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.onKey('.');
    });
    expect(result.current.display).toBe('$0.00');
  });

  it('converts setFromCentavos to formatted display', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.setFromCentavos(50000n);
    });
    expect(result.current.display).toBe('$500.00');
  });

  it('resets to $0.00', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.onKey('9');
      result.current.onKey('9');
    });
    expect(result.current.display).toBe('$99.00');
    act(() => result.current.reset());
    expect(result.current.display).toBe('$0.00');
  });

  it('never shows more than 2 decimal places', () => {
    const { result } = renderHook(() => useNumpadInput());
    act(() => {
      result.current.onKey('1');
      result.current.onKey('.');
      result.current.onKey('2');
      result.current.onKey('3');
      // Try adding a 3rd decimal — should be rejected
      result.current.onKey('4');
    });
    expect(result.current.display).toBe('$1.23');
  });
});
