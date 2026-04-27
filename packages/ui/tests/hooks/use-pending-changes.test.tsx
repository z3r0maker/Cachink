/**
 * `usePendingChanges` tests — covers the four routing branches by mode
 * plus the defensive "table missing on fresh install" path.
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as CachinkData from '@cachink/data';
import type { CachinkDatabase } from '@cachink/data';

// Controllable mode value the hook reads.
let MOCK_MODE: 'local' | 'cloud' | 'lan-server' | 'lan-client' | null = 'lan-client';
vi.mock('../../src/app-config/index', () => ({
  useMode: () => MOCK_MODE,
}));

// Stub DB; rows() responses are configured per-test.
let MOCK_MAX_ROW: { max: number | null } | undefined = { max: 0 };
let DB_THROWS = false;
const STUB_DB = {
  all: vi.fn(async () => {
    if (DB_THROWS) throw new Error('no such table');
    return MOCK_MAX_ROW ? [MOCK_MAX_ROW] : [];
  }),
} as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

let MOCK_HWM = 0;
vi.mock('@cachink/data', async () => {
  const actual = await vi.importActual<typeof CachinkData>('@cachink/data');
  return {
    ...actual,
    readHwm: vi.fn(async () => MOCK_HWM),
  };
});

import { usePendingChanges } from '../../src/hooks/use-pending-changes';

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('usePendingChanges', () => {
  beforeEach(() => {
    MOCK_MODE = 'lan-client';
    MOCK_MAX_ROW = { max: 0 };
    MOCK_HWM = 0;
    DB_THROWS = false;
  });

  it('returns 0 immediately when mode === local (no sync)', () => {
    MOCK_MODE = 'local';
    const { result } = renderHook(() => usePendingChanges(), { wrapper: makeWrapper() });
    expect(result.current.count).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('returns 0 immediately when mode === lan-server (host has no outbound sync)', () => {
    MOCK_MODE = 'lan-server';
    const { result } = renderHook(() => usePendingChanges(), { wrapper: makeWrapper() });
    expect(result.current.count).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('returns the difference between MAX(change_log.id) and localPushHwm for lan-client', async () => {
    MOCK_MODE = 'lan-client';
    MOCK_MAX_ROW = { max: 12 };
    MOCK_HWM = 8;
    const { result } = renderHook(() => usePendingChanges(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(4);
  });

  it('returns 0 when MAX(change_log.id) <= localPushHwm (everything synced)', async () => {
    MOCK_MODE = 'cloud';
    MOCK_MAX_ROW = { max: 5 };
    MOCK_HWM = 5;
    const { result } = renderHook(() => usePendingChanges(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(0);
  });

  it('returns 0 when the change_log table does not exist (fresh install)', async () => {
    MOCK_MODE = 'lan-client';
    DB_THROWS = true;
    MOCK_HWM = 0;
    const { result } = renderHook(() => usePendingChanges(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(0);
  });
});
