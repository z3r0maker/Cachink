/**
 * Tests for `cloud-handle-registry` (Slice 9.6 T14, R2-G14).
 *
 * The Round 2 audit's password-reset gap is: when CloudGate's
 * `onForgotPassword` fires, the overlay needs the SAME auth handle
 * `useCloudBridges` instantiated to call `resetPassword`. Earlier the
 * code held the handle behind an unused React Context, so the
 * password-reset call silently no-op'd. This spec verifies:
 *   - `setCloudHandle` updates make `useCloudAuthHandle` return the
 *     latest value.
 *   - Multiple subscribers see the same value (the overlay + any
 *     diagnostic surface).
 *   - Setting back to `null` clears the registry so a sign-out cleans
 *     up.
 */

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { setCloudHandle, useCloudAuthHandle } from '../../src/sync/cloud-handle-registry';
import type { CloudAuthHandle } from '../../src/sync/cloud-bridge';

function makeHandle(label: string): CloudAuthHandle {
  // Identity-only — the registry doesn't call any methods, it just
  // stores a reference. Tests on resetPassword wiring live in the
  // shell-level cloud-navigation tests when those land.
  return {
    signIn: async () => ({
      accessToken: label,
      userId: 'u',
      businessId: 'b',
      role: 'Director',
      expiresAt: 0,
    }),
    signUp: async () => ({
      accessToken: label,
      userId: 'u',
      businessId: 'b',
      role: 'Director',
      expiresAt: 0,
    }),
    signOut: async () => {
      /* no-op */
    },
    resetPassword: async () => {
      /* no-op */
    },
    getSession: async () => null,
    onAuthStateChange: () => () => undefined,
  };
}

describe('cloud-handle-registry', () => {
  it('returns null before any handle is registered', () => {
    setCloudHandle(null);
    const { result } = renderHook(() => useCloudAuthHandle());
    expect(result.current).toBeNull();
  });

  it('returns the published handle once setCloudHandle fires', () => {
    setCloudHandle(null);
    const handle = makeHandle('a');
    const { result } = renderHook(() => useCloudAuthHandle());
    expect(result.current).toBeNull();
    act(() => setCloudHandle(handle));
    expect(result.current).toBe(handle);
  });

  it('multiple subscribers see the same handle reactively', () => {
    setCloudHandle(null);
    const handle = makeHandle('shared');
    const a = renderHook(() => useCloudAuthHandle());
    const b = renderHook(() => useCloudAuthHandle());
    act(() => setCloudHandle(handle));
    expect(a.result.current).toBe(handle);
    expect(b.result.current).toBe(handle);
  });

  it('clears to null when setCloudHandle(null) is called', () => {
    const handle = makeHandle('x');
    setCloudHandle(handle);
    const { result } = renderHook(() => useCloudAuthHandle());
    expect(result.current).toBe(handle);
    act(() => setCloudHandle(null));
    expect(result.current).toBeNull();
  });

  it('treats identical references as a noop (no listener churn)', () => {
    setCloudHandle(null);
    const handle = makeHandle('once');
    setCloudHandle(handle);
    const { result, rerender } = renderHook(() => useCloudAuthHandle());
    expect(result.current).toBe(handle);
    // Same identity → no notify; render result remains stable.
    act(() => setCloudHandle(handle));
    rerender();
    expect(result.current).toBe(handle);
  });
});
