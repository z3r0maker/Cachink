/**
 * `useLanBridgeCallbacks` tests (Slice 8 M3-C12; ADR-039 retires the
 * companion `useWriteLanRole` hook).
 *
 * Validates the A2 revision: hosts now stamp the explicit `lanHostReady`
 * sync-state scope (NOT the prior `'cachink-host'` access-token sentinel),
 * and clients persist `auth.accessToken / serverUrl / businessId / pairedAt`
 * + the `currentBusinessId` AppConfig key as before.
 *
 * Mocks `@cachink/data`'s `writeSyncState` so we can assert exact (scope,
 * value) writes, and stubs `useDatabase` + `useAppConfigRepository` +
 * `useSetCurrentBusinessId` so the hook runs without a real DB.
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as CachinkData from '@cachink/data';
import type { CachinkDatabase } from '@cachink/data';

// --- Mocks ---------------------------------------------------------

const STUB_DB = { __stub: true } as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

const writeSyncStateMock = vi.fn(async () => {});
vi.mock('@cachink/data', async () => {
  const actual = await vi.importActual<typeof CachinkData>('@cachink/data');
  return {
    ...actual,
    writeSyncState: (db: unknown, scope: string, value: unknown) =>
      writeSyncStateMock(db, scope, value),
  };
});

const setMock = vi.fn(async () => {});
vi.mock('../../src/app/repository-provider', () => ({
  useAppConfigRepository: () => ({ set: setMock }),
}));

const setCurrentBusinessIdMock = vi.fn();
vi.mock('../../src/app-config/index', () => ({
  APP_CONFIG_KEYS: { currentBusinessId: 'currentBusinessId' },
  useSetCurrentBusinessId: () => setCurrentBusinessIdMock,
}));

// Import after mocks register.
import { useLanBridgeCallbacks } from '../../src/sync/lan-bridge-callbacks';

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useLanBridgeCallbacks (Slice 8 M3-C12)', () => {
  beforeEach(() => {
    writeSyncStateMock.mockClear();
    setMock.mockClear();
    setCurrentBusinessIdMock.mockClear();
  });

  it('onPaired writes the four auth scopes + sets currentBusinessId', async () => {
    const { result } = renderHook(() => useLanBridgeCallbacks(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.onPaired({
        serverUrl: 'http://192.168.1.5:43812',
        accessToken: 'real-token-abc',
        businessId: '01HX9999999999999999999999',
      });
    });

    const writeCalls = writeSyncStateMock.mock.calls;
    const scopesWritten = writeCalls.map((call) => call[1] as string);
    expect(scopesWritten).toEqual(
      expect.arrayContaining([
        'auth.accessToken',
        'auth.serverUrl',
        'auth.businessId',
        'auth.pairedAt',
      ]),
    );
    // Critically: A2 revision means we do NOT touch lanHostReady on a pair.
    expect(scopesWritten).not.toContain('lanHostReady');
    // AppConfig + Zustand both updated.
    expect(setMock).toHaveBeenCalledWith('currentBusinessId', '01HX9999999999999999999999');
    expect(setCurrentBusinessIdMock).toHaveBeenCalledWith('01HX9999999999999999999999');
  });

  it('onServerStarted writes lanHostReady=true (post-A2; replaces sentinel)', async () => {
    const { result } = renderHook(() => useLanBridgeCallbacks(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.onServerStarted({
        url: 'http://192.168.1.5:43812',
        pairingToken: 'pair-token-xyz',
        qrPngBase64: 'AAAA',
      });
    });

    const writeCalls = writeSyncStateMock.mock.calls;
    const scopesWritten = writeCalls.map((call) => call[1] as string);
    // Must stamp lanHostReady=true and the server URL.
    expect(scopesWritten).toEqual(expect.arrayContaining(['lanHostReady', 'auth.serverUrl']));
    const hostReadyCall = writeCalls.find((c) => c[1] === 'lanHostReady');
    expect(hostReadyCall?.[2]).toBe(true);
    // Critically: A2 revision means hosts must NEVER pollute the
    // access-token scope with a magic sentinel.
    expect(scopesWritten).not.toContain('auth.accessToken');
    expect(scopesWritten).not.toContain('auth.businessId');
    // Hosts don't have a businessId yet — currentBusinessId must NOT be
    // written from the host-start path.
    expect(setMock).not.toHaveBeenCalled();
    expect(setCurrentBusinessIdMock).not.toHaveBeenCalled();
  });
});

// `useWriteLanRole` was retired in ADR-039 — the wizard now writes
// `'lan-server'` / `'lan-client'` directly into AppMode. Tests dropped.
