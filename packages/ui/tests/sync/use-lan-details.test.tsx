/**
 * `useLanDetails` tests (Round 3 F4 coverage; updated for ADR-039).
 *
 * Composes `useMode`, `useLanSync`, `useDatabase`, and
 * `clearSyncState` into the `lanDetails` prop fed to `<Settings>`.
 * Post-ADR-039 the host-vs-client distinction lives in AppMode itself
 * (`'lan-server'` / `'lan-client'`); the legacy `useLanRole` hook is
 * retired.
 */

import type * as CachinkData from '@cachink/data';
import type { CachinkDatabase } from '@cachink/data';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// --- Mocks ---------------------------------------------------------

let MOCK_MODE: 'lan-server' | 'lan-client' | 'cloud' | 'local' | null = 'lan-client';
vi.mock('../../src/app-config/index', () => ({
  useMode: () => MOCK_MODE,
}));

let MOCK_LAN_SYNC = { connectedDevices: 0, status: 'idle' };
vi.mock('../../src/hooks/use-lan-sync', () => ({
  useLanSync: () => MOCK_LAN_SYNC,
}));

const STUB_DB = { __stub: true } as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

let MOCK_SERVER_URL: string | null = 'http://192.168.1.10:8787';
const clearSyncStateMock = vi.fn(async () => {});
vi.mock('@cachink/data', async () => {
  const actual = await vi.importActual<typeof CachinkData>('@cachink/data');
  return {
    ...actual,
    readSyncState: vi.fn(async (_db: unknown, scope: string) => {
      if (scope === 'auth.serverUrl') return MOCK_SERVER_URL;
      return null;
    }),
    clearSyncState: (db: CachinkDatabase) => clearSyncStateMock(db),
  };
});

// react-query QueryClientProvider wrapper for useQueryClient.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { useLanDetails } from '../../src/sync/use-lan-details';

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('useLanDetails', () => {
  beforeEach(() => {
    MOCK_MODE = 'lan-client';
    MOCK_LAN_SYNC = { connectedDevices: 0, status: 'idle' };
    MOCK_SERVER_URL = 'http://192.168.1.10:8787';
    clearSyncStateMock.mockClear();
  });

  it('returns null when mode === cloud', async () => {
    MOCK_MODE = 'cloud';
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('returns null when mode === local', async () => {
    MOCK_MODE = 'local';
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('returns the LanDetails record when mode === lan-client', async () => {
    MOCK_MODE = 'lan-client';
    MOCK_LAN_SYNC = { connectedDevices: 2, status: 'online' };
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails(), { wrapper });
    await settle();
    expect(result.current).not.toBeNull();
    expect(result.current?.connectedDevices).toBe(2);
    expect(result.current?.isHost).toBe(false);
    expect(result.current?.serverUrl).toBe('http://192.168.1.10:8787');
    expect(result.current?.onStopHostServer).toBeUndefined();
  });

  it('flags isHost when mode === lan-server', async () => {
    MOCK_MODE = 'lan-server';
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails(), { wrapper });
    await settle();
    expect(result.current?.isHost).toBe(true);
  });

  it('exposes onStopHostServer when stopHostServer is provided', async () => {
    MOCK_MODE = 'lan-server';
    const stopHostServer = vi.fn(async () => {});
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails({ stopHostServer }), { wrapper });
    await settle();
    expect(result.current?.onStopHostServer).toBeTypeOf('function');
    await act(async () => {
      result.current?.onStopHostServer?.();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(stopHostServer).toHaveBeenCalled();
  });

  it('onUnpair invokes clearSyncState and invalidates queries', async () => {
    MOCK_MODE = 'lan-client';
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails(), { wrapper });
    await settle();
    await act(async () => {
      result.current?.onUnpair();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(clearSyncStateMock).toHaveBeenCalledWith(STUB_DB);
  });

  it('exposes a null serverUrl when readSyncState returns nothing', async () => {
    MOCK_SERVER_URL = null;
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLanDetails(), { wrapper });
    await settle();
    expect(result.current?.serverUrl).toBeNull();
  });
});
