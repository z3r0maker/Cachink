/**
 * `useLastConflicts` tests (Slice 8 M3-C12).
 *
 * Covers the three observable branches: empty result, mapped rows, and
 * the swallow-on-missing-table fallback. The hook reads
 * `__cachink_conflicts` via `db.all(sql\`...\`)` so we stub the
 * `useDatabase()` return value with a controllable `all` method.
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CachinkDatabase } from '@cachink/data';

let MOCK_ROWS: ReadonlyArray<unknown> = [];
let SHOULD_THROW = false;
const allMock = vi.fn(async () => {
  if (SHOULD_THROW) throw new Error('no such table: __cachink_conflicts');
  return MOCK_ROWS;
});

const STUB_DB = { all: allMock } as unknown as CachinkDatabase;
vi.mock('../../src/database/_internal', () => ({
  useDatabase: () => STUB_DB,
}));

import { useLastConflicts } from '../../src/hooks/use-last-conflicts';

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useLastConflicts (Slice 8 M3-C12)', () => {
  beforeEach(() => {
    MOCK_ROWS = [];
    SHOULD_THROW = false;
    allMock.mockClear();
  });

  it('returns an empty array when the table has no rows', async () => {
    const { result } = renderHook(() => useLastConflicts(5), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conflicts).toEqual([]);
  });

  it('maps raw snake_case columns to the camelCase SyncConflictRow shape', async () => {
    MOCK_ROWS = [
      {
        id: 7,
        detected_at: '2026-04-25T00:00:00.000Z',
        direction: 'inbound',
        table_name: 'sales',
        row_id: '01HX0000000000000000000001',
        loser_updated_at: '2026-04-25T00:00:00.000Z',
        loser_device_id: 'DEV-LOSER',
        winner_updated_at: '2026-04-25T00:00:01.000Z',
        winner_device_id: 'DEV-WIN',
        reason: 'older-row',
      },
    ];
    const { result } = renderHook(() => useLastConflicts(5), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conflicts).toEqual([
      {
        id: 7,
        detectedAt: '2026-04-25T00:00:00.000Z',
        direction: 'inbound',
        tableName: 'sales',
        rowId: '01HX0000000000000000000001',
        loserUpdatedAt: '2026-04-25T00:00:00.000Z',
        loserDeviceId: 'DEV-LOSER',
        winnerUpdatedAt: '2026-04-25T00:00:01.000Z',
        winnerDeviceId: 'DEV-WIN',
        reason: 'older-row',
      },
    ]);
  });

  it('returns an empty array when the conflicts table does not exist', async () => {
    SHOULD_THROW = true;
    const { result } = renderHook(() => useLastConflicts(5), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conflicts).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
