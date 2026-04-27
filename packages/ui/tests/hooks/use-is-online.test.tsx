/**
 * `useIsOnline` (web variant) tests — covers the navigator.onLine
 * boot read plus `'online'` / `'offline'` event subscription.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIsOnline } from '../../src/hooks/use-is-online.web';

const ORIGINAL_ON_LINE = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

function setOnLine(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

afterEach(() => {
  if (ORIGINAL_ON_LINE) {
    Object.defineProperty(window.navigator, 'onLine', ORIGINAL_ON_LINE);
  }
});

describe('useIsOnline (web)', () => {
  beforeEach(() => {
    setOnLine(true);
  });

  it('returns true when navigator.onLine is true on mount', () => {
    setOnLine(true);
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
  });

  it('returns false when navigator.onLine is false on mount', () => {
    setOnLine(false);
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(false);
  });

  it('flips to false when an "offline" event fires', () => {
    setOnLine(true);
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  it('flips back to true when an "online" event fires', () => {
    setOnLine(false);
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(false);
    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
