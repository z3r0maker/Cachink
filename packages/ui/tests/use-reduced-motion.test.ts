import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import {
  motionDuration,
  useReducedMotion,
  REDUCED_MOTION_DURATION_MS,
} from '../src/hooks/use-reduced-motion';

describe('motionDuration', () => {
  it('passes the preferred duration through when motion is allowed', () => {
    expect(motionDuration(300, false)).toBe(300);
  });

  it('collapses to a near-instant duration when motion is reduced', () => {
    expect(motionDuration(300, true)).toBe(REDUCED_MOTION_DURATION_MS);
  });
});

describe('useReducedMotion', () => {
  let remove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    remove = vi.fn();
    vi.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove,
    } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the OS preference once it resolves', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('defaults to allowing motion when no preference is set', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('falls back to allowing motion when the platform query rejects', async () => {
    // Platforms without the native module reject rather than resolve; the
    // hook must not surface that as an unhandled rejection.
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(
      new Error('unsupported'),
    );
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('unsubscribes on unmount so a flipped setting cannot update a dead tree', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(remove).toHaveBeenCalled();
  });
});
