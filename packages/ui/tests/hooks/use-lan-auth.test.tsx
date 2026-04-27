/**
 * `useLanAuthToken` + `useLanHostReady` tests (Slice 8 M3-C12,
 * ADR-039 — `useLanRole` is retired).
 *
 * Both hooks read from `__cachink_sync_state` via the same `safeRead`
 * wrapper that swallows "table missing" errors. This file stubs
 * `@cachink/data`'s `readSyncState` to drive each branch of the tiny
 * mapping logic each hook owns:
 *
 *   - useLanAuthToken: returns `{ token, businessId, loading }` mapped
 *     from `auth.accessToken` / `auth.businessId`.
 *   - useLanHostReady: returns `{ ready: boolean, loading }` from the
 *     `lanHostReady` scope (the A2 revision target).
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as CachinkData from '@cachink/data';
import type { CachinkDatabase } from '@cachink/data';

// --- Mocks ---------------------------------------------------------

const STUB_DB = { __stub: true } as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

let MOCK_VALUES: Record<string, unknown> = {};
let SHOULD_THROW = false;
const readSyncStateMock = vi.fn(async (_db: unknown, scope: string) => {
  if (SHOULD_THROW) throw new Error('no such table: __cachink_sync_state');
  return MOCK_VALUES[scope] ?? null;
});

vi.mock('@cachink/data', async () => {
  const actual = await vi.importActual<typeof CachinkData>('@cachink/data');
  return {
    ...actual,
    readSyncState: (db: unknown, scope: string) => readSyncStateMock(db, scope),
  };
});

// Import after mocks register.
import { useLanAuthToken, useLanHostReady } from '../../src/hooks/use-lan-auth';

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useLanAuthToken', () => {
  beforeEach(() => {
    MOCK_VALUES = {};
    SHOULD_THROW = false;
    readSyncStateMock.mockClear();
  });

  it('returns null token + null businessId when nothing is stored', async () => {
    const { result } = renderHook(() => useLanAuthToken(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBeNull();
    expect(result.current.businessId).toBeNull();
  });

  it('returns the stored token + businessId on a successful round-trip', async () => {
    MOCK_VALUES = {
      'auth.accessToken': 'real-token',
      'auth.businessId': '01HX9999999999999999999999',
    };
    const { result } = renderHook(() => useLanAuthToken(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBe('real-token');
    expect(result.current.businessId).toBe('01HX9999999999999999999999');
  });

  it('returns null when the sync-state table does not exist (pre-migration)', async () => {
    SHOULD_THROW = true;
    const { result } = renderHook(() => useLanAuthToken(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBeNull();
    expect(result.current.businessId).toBeNull();
  });
});

// `useLanRole` was retired in ADR-039 — wizard role choice now lives in
// AppMode (`'lan-server'` / `'lan-client'`). Tests dropped accordingly.

describe('useLanHostReady (Slice 8 A2 — replaces sentinel)', () => {
  beforeEach(() => {
    MOCK_VALUES = {};
    SHOULD_THROW = false;
    readSyncStateMock.mockClear();
  });

  it('returns ready=false when the scope is unset', async () => {
    const { result } = renderHook(() => useLanHostReady(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(false);
  });

  it('returns ready=true when the scope is true', async () => {
    MOCK_VALUES = { lanHostReady: true };
    const { result } = renderHook(() => useLanHostReady(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(true);
  });

  it('returns ready=false when the scope holds anything other than true', async () => {
    // Defensive: a future caller writing a non-boolean truthy value
    // (e.g. the timestamp the host became ready) must not flip the
    // gate accidentally. The hook checks `=== true`, not truthiness.
    MOCK_VALUES = { lanHostReady: '2026-04-25T00:00:00.000Z' };
    const { result } = renderHook(() => useLanHostReady(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(false);
  });

  it('returns ready=false when the sync-state table does not exist', async () => {
    SHOULD_THROW = true;
    const { result } = renderHook(() => useLanHostReady(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(false);
  });
});
