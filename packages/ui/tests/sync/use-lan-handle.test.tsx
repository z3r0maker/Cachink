/**
 * `useLanHandle` host-skip regression tests (Round 3 F6, ADR-039).
 *
 * Per ADR-039, the `lan-server` vs `lan-client` distinction lives in
 * AppMode itself; only `'lan-client'` instantiates a sync client. A
 * host (`'lan-server'`) running the bundled Rust LAN server would
 * otherwise spin up a JS client pointed at its own server — pushing /
 * pulling against itself in a loop, thrashing auth and growing the
 * change_log unboundedly.
 *
 * The fix is correctness-critical and unit-test-light: this file
 * regression-guards the host gate plus the happy client path, so a
 * future refactor can't quietly drop the skip.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type * as CachinkData from '@cachink/data';
import type { CachinkDatabase } from '@cachink/data';
import type * as LanBridgeModule from '../../src/sync/lan-bridge';
import type { LanSyncHandle } from '../../src/sync/lan-bridge';

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// --- Mocks ---------------------------------------------------------

const STUB_HANDLE: LanSyncHandle = {
  dispose: vi.fn(async () => {}),
  getState: () => ({
    status: 'idle',
    lastServerSeq: 0,
    connectedDevices: 0,
    lastError: null,
  }),
  subscribe: () => () => {},
  retryNow: vi.fn(async () => {}),
};
const mockInitLanSyncIfMode = vi.fn(async (): Promise<LanSyncHandle | null> => STUB_HANDLE);
vi.mock('../../src/sync/lan-bridge', async () => {
  const actual = await vi.importActual<typeof LanBridgeModule>('../../src/sync/lan-bridge');
  return {
    ...actual,
    initLanSyncIfMode: (mode: unknown, args: unknown) =>
      mockInitLanSyncIfMode(mode as never, args as never),
  };
});

const STUB_DB = { __stub: true } as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

// Controllable AppConfig values.
let MOCK_MODE: 'lan-server' | 'lan-client' | 'cloud' | 'local' | null = 'lan-client';
let MOCK_DEVICE_ID: string | null = 'DEV-1';
vi.mock('../../src/app-config/index', () => ({
  useDeviceId: () => MOCK_DEVICE_ID,
  useMode: () => MOCK_MODE,
}));

// Controllable LAN auth state.
let MOCK_TOKEN: string | null = 'real-token';
vi.mock('../../src/hooks/use-lan-auth', () => ({
  useLanAuthToken: () => ({ token: MOCK_TOKEN, businessId: null, loading: false }),
}));

const MOCK_SERVER_URL = 'http://192.168.1.10:8787';
vi.mock('@cachink/data', async () => {
  const actual = await vi.importActual<typeof CachinkData>('@cachink/data');
  return {
    ...actual,
    readSyncState: vi.fn(async (_db: unknown, scope: string) => {
      if (scope === 'auth.serverUrl') return MOCK_SERVER_URL;
      return null;
    }),
  };
});

import { useLanHandle } from '../../src/sync/use-lan-handle';

describe('useLanHandle host-skip behaviour (Round 3 F6, ADR-039)', () => {
  beforeEach(() => {
    mockInitLanSyncIfMode.mockClear();
    MOCK_MODE = 'lan-client';
    MOCK_DEVICE_ID = 'DEV-1';
    MOCK_TOKEN = 'real-token';
  });

  it('returns a handle when mode === lan-client + a real token is stored', async () => {
    MOCK_MODE = 'lan-client';
    MOCK_TOKEN = 'real-token';
    const { result } = renderHook(() => useLanHandle());
    // Bumped from the default 1000 ms — under workspace-wide parallel
    // CPU pressure the renderHook + Zustand effect chain occasionally
    // misses the 1 s budget while passing in <500 ms in isolation. The
    // assertion semantics are unchanged.
    await waitFor(
      () => {
        expect(mockInitLanSyncIfMode).toHaveBeenCalledTimes(1);
      },
      { timeout: 4000 },
    );
    await waitFor(
      () => {
        expect(result.current).toBe(STUB_HANDLE);
      },
      { timeout: 4000 },
    );
  });

  it('skips when mode === lan-server (host should not run a client)', async () => {
    MOCK_MODE = 'lan-server';
    MOCK_TOKEN = 'real-token';
    const { result } = renderHook(() => useLanHandle());
    await settle();
    expect(mockInitLanSyncIfMode).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('skips when mode === cloud even with a token', async () => {
    MOCK_MODE = 'cloud';
    MOCK_TOKEN = 'real-token';
    const { result } = renderHook(() => useLanHandle());
    await settle();
    expect(mockInitLanSyncIfMode).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('skips when the device has no deviceId yet (first-boot pre-hydration)', async () => {
    MOCK_MODE = 'lan-client';
    MOCK_DEVICE_ID = null;
    MOCK_TOKEN = 'real-token';
    const { result } = renderHook(() => useLanHandle());
    await settle();
    expect(mockInitLanSyncIfMode).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});
