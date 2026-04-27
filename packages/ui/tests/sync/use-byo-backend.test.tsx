/**
 * `useByoBackend` tests (Slice 8 M3-C12).
 *
 * Validates the read/write contract for the `cloud.byoBackend` sync-state
 * scope: returns null when nothing's stored, parses + returns valid
 * config rows, and forwards `save` / `clear` to `writeSyncState` plus
 * invalidates the query.
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as CachinkData from '@cachink/data';
import type { CachinkDatabase } from '@cachink/data';

// --- Mocks ---------------------------------------------------------

const STUB_DB = { __stub: true } as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

let MOCK_VALUE: unknown = null;
let SHOULD_THROW = false;
const writeSyncStateMock = vi.fn(async (_db: unknown, _scope: string, value: unknown) => {
  MOCK_VALUE = value;
});

vi.mock('@cachink/data', async () => {
  const actual = await vi.importActual<typeof CachinkData>('@cachink/data');
  return {
    ...actual,
    readSyncState: vi.fn(async () => {
      if (SHOULD_THROW) throw new Error('no such table: __cachink_sync_state');
      return MOCK_VALUE;
    }),
    writeSyncState: (db: unknown, scope: string, value: unknown) =>
      writeSyncStateMock(db, scope, value),
  };
});

import { useByoBackend } from '../../src/sync/use-byo-backend';

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const VALID_CONFIG = {
  projectUrl: 'https://proyecto.supabase.co',
  anonKey: 'eyJhanonkey',
  powersyncUrl: null,
};

describe('useByoBackend (Slice 8 M3-C12)', () => {
  beforeEach(() => {
    MOCK_VALUE = null;
    SHOULD_THROW = false;
    writeSyncStateMock.mockClear();
  });

  it('returns null when nothing is stored', async () => {
    const { result } = renderHook(() => useByoBackend(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toBeNull();
  });

  it('returns the parsed config when a valid record is stored', async () => {
    MOCK_VALUE = VALID_CONFIG;
    const { result } = renderHook(() => useByoBackend(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toEqual(VALID_CONFIG);
  });

  it('returns null when the stored value fails the shape guard', async () => {
    // Missing anonKey — must be rejected by isBackendConfig.
    MOCK_VALUE = { projectUrl: 'https://x.supabase.co' };
    const { result } = renderHook(() => useByoBackend(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toBeNull();
  });

  it('returns null when the sync-state table does not exist', async () => {
    SHOULD_THROW = true;
    const { result } = renderHook(() => useByoBackend(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toBeNull();
  });

  it('save() persists the config via writeSyncState', async () => {
    const { result } = renderHook(() => useByoBackend(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.save(VALID_CONFIG);
    });
    expect(writeSyncStateMock).toHaveBeenCalledWith(STUB_DB, 'cloud.byoBackend', VALID_CONFIG);
  });

  it('clear() writes null so the next read returns null', async () => {
    const { result } = renderHook(() => useByoBackend(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.clear();
    });
    expect(writeSyncStateMock).toHaveBeenCalledWith(STUB_DB, 'cloud.byoBackend', null);
  });
});
