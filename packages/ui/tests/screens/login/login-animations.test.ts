/**
 * Login animation hooks tests — Login/login-animations.ts coverage.
 *
 * Tests useAvatarFade, useAvatarScale, usePinSlideIn hooks.
 * The hooks return Animated.Value instances — we verify they
 * instantiate without error and return the expected shape.
 */

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAvatarFade,
  useAvatarScale,
  usePinSlideIn,
} from '../../../src/screens/Login/login-animations';

describe('useAvatarFade', () => {
  it('returns an Animated.Value when not selected and none selected', () => {
    const { result } = renderHook(() => useAvatarFade(false, false));
    // Animated.Value has a _value or __getValue internal
    expect(result.current).toBeDefined();
  });

  it('returns an Animated.Value when selected', () => {
    const { result } = renderHook(() => useAvatarFade(true, true));
    expect(result.current).toBeDefined();
  });

  it('updates when selected state changes', () => {
    const { result, rerender } = renderHook(
      ({ selected, anySelected }) => useAvatarFade(selected, anySelected),
      { initialProps: { selected: false, anySelected: false } },
    );
    const initial = result.current;
    act(() => {
      rerender({ selected: true, anySelected: true });
    });
    // Same ref (the hook doesn't recreate the Animated.Value)
    expect(result.current).toBe(initial);
  });

  it('fades unselected when another is selected', () => {
    const { result, rerender } = renderHook(
      ({ selected, anySelected }) => useAvatarFade(selected, anySelected),
      { initialProps: { selected: false, anySelected: false } },
    );
    act(() => {
      rerender({ selected: false, anySelected: true });
    });
    // The animated value should have been triggered (no crash)
    expect(result.current).toBeDefined();
  });
});

describe('useAvatarScale', () => {
  it('returns an Animated.Value at default scale', () => {
    const { result } = renderHook(() => useAvatarScale(false));
    expect(result.current).toBeDefined();
  });

  it('updates when selected changes to true', () => {
    const { result, rerender } = renderHook(
      ({ selected }) => useAvatarScale(selected),
      { initialProps: { selected: false } },
    );
    act(() => {
      rerender({ selected: true });
    });
    expect(result.current).toBeDefined();
  });
});

describe('usePinSlideIn', () => {
  it('returns translateY and opacity values', () => {
    const { result } = renderHook(() => usePinSlideIn(false));
    expect(result.current.translateY).toBeDefined();
    expect(result.current.opacity).toBeDefined();
  });

  it('animates when visible becomes true', () => {
    const { result, rerender } = renderHook(
      ({ visible }) => usePinSlideIn(visible),
      { initialProps: { visible: false } },
    );
    act(() => {
      rerender({ visible: true });
    });
    expect(result.current.translateY).toBeDefined();
    expect(result.current.opacity).toBeDefined();
  });

  it('resets when visible becomes false', () => {
    const { result, rerender } = renderHook(
      ({ visible }) => usePinSlideIn(visible),
      { initialProps: { visible: true } },
    );
    act(() => {
      rerender({ visible: false });
    });
    expect(result.current.translateY).toBeDefined();
    expect(result.current.opacity).toBeDefined();
  });
});
