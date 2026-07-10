/**
 * useRequirePin tests — PIN gate state machine.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequirePin } from '../../src/hooks/use-require-pin';

describe('useRequirePin', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useRequirePin());
    expect(result.current.isOpen).toBe(false);
  });

  it('opens PIN prompt on requestPin()', async () => {
    const { result } = renderHook(() => useRequirePin());
    let pinPromise: Promise<string | null>;

    act(() => {
      pinPromise = result.current.requestPin();
    });

    expect(result.current.isOpen).toBe(true);

    // Submit a PIN
    act(() => {
      result.current.submitPin('123456');
    });

    expect(result.current.isOpen).toBe(false);
    const pin = await pinPromise!;
    expect(pin).toBe('123456');
  });

  it('returns null when dismissed', async () => {
    const { result } = renderHook(() => useRequirePin());
    let pinPromise: Promise<string | null>;

    act(() => {
      pinPromise = result.current.requestPin();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isOpen).toBe(false);
    const pin = await pinPromise!;
    expect(pin).toBeNull();
  });
});
