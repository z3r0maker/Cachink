/**
 * ConflictosRecientesCard tests (Slice 8 M3-C12).
 *
 * The card consumes `useLastConflicts(5)` and renders nothing when the
 * result is empty (per CLAUDE.md §1: conflicts surface inline, never
 * silently — but only when there ARE conflicts). When non-empty, it
 * renders one row per conflict with the table name + reason + a
 * truncated device id.
 */

import type { SyncConflictRow } from '../../src/hooks/use-last-conflicts';
import type * as UseLastConflictsModule from '../../src/hooks/use-last-conflicts';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConflictosRecientesCard } from '../../src/screens/DirectorHome/conflictos-recientes-card';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

let MOCK_CONFLICTS: readonly SyncConflictRow[] = [];
let MOCK_LOADING = false;

vi.mock('../../src/hooks/use-last-conflicts', async () => {
  const actual = await vi.importActual<typeof UseLastConflictsModule>(
    '../../src/hooks/use-last-conflicts',
  );
  return {
    ...actual,
    useLastConflicts: () => ({
      conflicts: MOCK_CONFLICTS,
      loading: MOCK_LOADING,
      error: null,
    }),
  };
});

function makeConflict(overrides: Partial<SyncConflictRow> = {}): SyncConflictRow {
  return {
    id: 1,
    detectedAt: '2026-04-25T00:00:00.000Z',
    direction: 'inbound',
    tableName: 'sales',
    rowId: '01HX0000000000000000000001',
    loserUpdatedAt: '2026-04-25T00:00:00.000Z',
    loserDeviceId: 'DEV-XYZABC123',
    winnerUpdatedAt: '2026-04-25T00:00:01.000Z',
    winnerDeviceId: 'DEV-OTHER',
    reason: 'older-row',
    ...overrides,
  };
}

describe('ConflictosRecientesCard (Slice 8 M3-C12)', () => {
  beforeEach(() => {
    MOCK_CONFLICTS = [];
    MOCK_LOADING = false;
  });

  it('renders nothing when there are zero conflicts', () => {
    renderWithProviders(<ConflictosRecientesCard />);
    expect(screen.queryByTestId('conflictos-recientes-card')).toBeNull();
  });

  it('renders nothing while the query is loading (even if conflicts are present)', () => {
    MOCK_LOADING = true;
    MOCK_CONFLICTS = [makeConflict()];
    renderWithProviders(<ConflictosRecientesCard />);
    expect(screen.queryByTestId('conflictos-recientes-card')).toBeNull();
  });

  it('renders one row per conflict when there are entries', () => {
    MOCK_CONFLICTS = [
      makeConflict({ id: 1, tableName: 'sales' }),
      makeConflict({ id: 2, tableName: 'expenses' }),
    ];
    renderWithProviders(<ConflictosRecientesCard />);
    expect(screen.getByTestId('conflictos-recientes-card')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('expenses')).toBeInTheDocument();
  });

  it('truncates loserDeviceId to the last 6 chars prefixed with an ellipsis', () => {
    MOCK_CONFLICTS = [
      makeConflict({ loserDeviceId: 'DEV-LONG-DEVICE-ID-XYZABC', reason: 'older-row' }),
    ];
    renderWithProviders(<ConflictosRecientesCard />);
    // The row text is "<reason> · …<last6>" — match on the suffix.
    expect(screen.getByText(/older-row · …XYZABC/)).toBeInTheDocument();
  });

  it('does NOT truncate device IDs already short enough (≤ 6 chars)', () => {
    MOCK_CONFLICTS = [makeConflict({ loserDeviceId: 'ABC123', reason: 'newer-row' })];
    renderWithProviders(<ConflictosRecientesCard />);
    expect(screen.getByText('newer-row · ABC123')).toBeInTheDocument();
  });
});
