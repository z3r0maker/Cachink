/**
 * `useCloudSession` tests (Slice 8 M3-C12).
 *
 * Subscribes to a `CloudAuthHandle` and exposes the current credentials
 * (signedIn / isLoading / error) plus convenience `signOut` / `refresh`
 * actions. Tests cover the four observable states: no-handle inert,
 * happy-path getSession, onAuthStateChange propagation, and the action
 * forwarding.
 */

import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { CloudAuthHandle, CloudCredentials } from '../../src/sync/cloud-bridge';
import { useCloudSession } from '../../src/hooks/use-cloud-session';

const FAKE_CREDS: CloudCredentials = {
  accessToken: 'tok',
  userId: 'u1',
  businessId: '01HX9999999999999999999999',
  role: 'Director',
  expiresAt: Date.now() + 3_600_000,
};

function makeHandle(overrides?: Partial<CloudAuthHandle>): CloudAuthHandle {
  return {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    getSession: vi.fn().mockResolvedValue(null),
    onAuthStateChange: vi.fn(() => () => undefined),
    ...overrides,
  };
}

describe('useCloudSession (Slice 8 M3-C12)', () => {
  it('returns inert state immediately when handle is null', async () => {
    const { result } = renderHook(() => useCloudSession(null));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.signedIn).toBe(false);
    expect(result.current.credentials).toBeNull();
    // Action calls are no-ops.
    await act(async () => {
      await result.current.signOut();
      await result.current.refresh();
    });
    // No errors thrown.
  });

  it('mirrors getSession() on mount when it returns null (signed-out)', async () => {
    const handle = makeHandle({ getSession: vi.fn().mockResolvedValue(null) });
    const { result } = renderHook(() => useCloudSession(handle));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signedIn).toBe(false);
    expect(result.current.credentials).toBeNull();
  });

  it('mirrors getSession() on mount when it returns credentials (signed-in)', async () => {
    const handle = makeHandle({ getSession: vi.fn().mockResolvedValue(FAKE_CREDS) });
    const { result } = renderHook(() => useCloudSession(handle));
    await waitFor(() => expect(result.current.signedIn).toBe(true));
    expect(result.current.credentials).toEqual(FAKE_CREDS);
  });

  it('updates state when onAuthStateChange listener fires', async () => {
    let listener: ((c: CloudCredentials | null) => void) | null = null;
    const handle = makeHandle({
      getSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: vi.fn((cb) => {
        listener = cb;
        return () => undefined;
      }),
    });
    const { result } = renderHook(() => useCloudSession(handle));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signedIn).toBe(false);

    // Simulate Supabase firing a token-refresh event.
    act(() => {
      listener?.(FAKE_CREDS);
    });

    expect(result.current.signedIn).toBe(true);
    expect(result.current.credentials).toEqual(FAKE_CREDS);
  });

  it('forwards signOut to the handle and is a no-op when handle is null', async () => {
    const handle = makeHandle();
    const { result } = renderHook(() => useCloudSession(handle));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.signOut();
    });
    expect(handle.signOut).toHaveBeenCalledTimes(1);
  });
});
