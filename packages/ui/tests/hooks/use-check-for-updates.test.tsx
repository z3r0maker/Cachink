/**
 * `useCheckForUpdates` tests (Slice 8 M3-C12).
 *
 * Covers all five observable status transitions: unsupported (no
 * adapter), up-to-date, downloaded, downloading, and error. Plus the
 * apply() pass-through.
 */

import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCheckForUpdates, type UpdateAdapter } from '../../src/hooks/use-check-for-updates';

describe('useCheckForUpdates (Slice 8 M3-C12)', () => {
  it('starts in idle and resolves to unsupported when adapter is null', async () => {
    const { result } = renderHook(() => useCheckForUpdates(null));
    expect(result.current.status).toBe('idle');
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.status).toBe('unsupported');
  });

  it("transitions checking → up-to-date when adapter returns 'up-to-date'", async () => {
    const adapter: UpdateAdapter = {
      check: vi.fn().mockResolvedValue('up-to-date'),
    };
    const { result } = renderHook(() => useCheckForUpdates(adapter));
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.status).toBe('up-to-date');
    expect(result.current.error).toBeNull();
  });

  it('transitions to downloaded when adapter returns { ready: true }', async () => {
    const adapter: UpdateAdapter = {
      check: vi.fn().mockResolvedValue({ ready: true }),
    };
    const { result } = renderHook(() => useCheckForUpdates(adapter));
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.status).toBe('downloaded');
  });

  it('transitions to downloading when adapter returns { ready: false }', async () => {
    const adapter: UpdateAdapter = {
      check: vi.fn().mockResolvedValue({ ready: false }),
    };
    const { result } = renderHook(() => useCheckForUpdates(adapter));
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.status).toBe('downloading');
  });

  it('transitions to error and stores the Error when adapter rejects', async () => {
    const adapter: UpdateAdapter = {
      check: vi.fn().mockRejectedValue(new Error('Network unreachable')),
    };
    const { result } = renderHook(() => useCheckForUpdates(adapter));
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('Network unreachable');
  });

  it('apply() forwards to adapter.applyIfReady when available', async () => {
    const applyIfReady = vi.fn().mockResolvedValue(undefined);
    const adapter: UpdateAdapter = {
      check: vi.fn().mockResolvedValue('up-to-date'),
      applyIfReady,
    };
    const { result } = renderHook(() => useCheckForUpdates(adapter));
    await act(async () => {
      await result.current.apply();
    });
    expect(applyIfReady).toHaveBeenCalledTimes(1);
  });
});
