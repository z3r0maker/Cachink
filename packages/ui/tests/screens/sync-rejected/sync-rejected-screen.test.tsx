/**
 * "No enviados" (A-08): empty state, reason + hint, retry wiring, and no
 * retry button while automatic retries are still scheduled. Plus the pill
 * routing: rejected rows open this screen instead of syncing.
 */

import { describe, expect, it, vi } from 'vitest';
import type { RejectedRow } from '@xangarro/sync';
import { SyncRejectedScreen } from '../../../src/screens/SyncRejected/index';
import { CloudSyncPill } from '../../../src/screens/AppShell/cloud-sync-pill';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

vi.mock('../../../src/app/cloud-sync-bridge', () => ({
  CLOUD_SYNC_QUERY_KEY: ['cloudSync'],
  useCloudSync: () => ({
    state: {
      phase: 'idle',
      counts: { pending: 0, rejected: 2, retrying: 0 },
      lastSyncAt: null,
    },
    syncNow: mockSyncNow,
  }),
}));
const mockSyncNow = vi.fn();

initI18n();

const SALE: RejectedRow = {
  tableName: 'sales',
  rowId: 'S1',
  code: 'FK_PRODUCT_MISSING',
  message: 'productoId=P1 not found',
  retryable: false,
  attempts: 1,
  lastAttemptAt: '2026-09-16T14:32:00.000Z',
  row: { monto: 12000n, concepto: 'Tacos', fecha: '2026-09-16' },
};

describe('SyncRejectedScreen', () => {
  it('says everything was sent when nothing is rejected', () => {
    renderWithProviders(<SyncRejectedScreen rows={[]} onRetry={vi.fn()} />);
    expect(screen.getByTestId('no-enviados-empty')).toBeInTheDocument();
  });

  it('shows the record, the reason and the deleted-product hint', () => {
    renderWithProviders(<SyncRejectedScreen rows={[SALE]} onRetry={vi.fn()} />);
    expect(screen.getByText('Venta · $120.00 · Tacos · 2026-09-16')).toBeInTheDocument();
    expect(screen.getByTestId('no-enviado-reason-sales:S1')).toHaveTextContent(
      'El producto de este registro ya no existe en el portal.',
    );
    expect(screen.getByText(/regístrala con otro producto/)).toBeInTheDocument();
  });

  it('retries the tapped row and never offers delete', () => {
    const onRetry = vi.fn();
    renderWithProviders(<SyncRejectedScreen rows={[SALE]} onRetry={onRetry} />);
    fireEvent.click(screen.getByTestId('no-enviado-retry-sales:S1'));
    expect(onRetry).toHaveBeenCalledWith([SALE]);
    expect(screen.queryByText(/Eliminar/)).toBeNull();
  });

  it('retries every row waiting for a human at once', () => {
    const onRetry = vi.fn();
    const movement = { ...SALE, tableName: 'inventory_movements', rowId: 'M1', row: null };
    const auto = { ...SALE, rowId: 'S2', retryable: true };
    renderWithProviders(<SyncRejectedScreen rows={[SALE, movement, auto]} onRetry={onRetry} />);
    fireEvent.click(screen.getByTestId('no-enviados-retry-all'));
    expect(onRetry).toHaveBeenCalledWith([SALE, movement]);
  });

  it('hides "retry all" when only one row needs a human', () => {
    renderWithProviders(<SyncRejectedScreen rows={[SALE]} onRetry={vi.fn()} />);
    expect(screen.queryByTestId('no-enviados-retry-all')).toBeNull();
  });

  it('shows "reintentando" instead of a button while retries are scheduled', () => {
    renderWithProviders(
      <SyncRejectedScreen rows={[{ ...SALE, retryable: true }]} onRetry={vi.fn()} />,
    );
    expect(screen.getByTestId('no-enviado-retrying-sales:S1')).toBeInTheDocument();
    expect(screen.queryByTestId('no-enviado-retry-sales:S1')).toBeNull();
  });
});

describe('CloudSyncPill with rejected rows', () => {
  it('opens "No enviados" instead of syncing', () => {
    const onOpenRejected = vi.fn();
    renderWithProviders(<CloudSyncPill onOpenRejected={onOpenRejected} />);
    fireEvent.click(screen.getByTestId('cloud-sync-pill'));
    expect(onOpenRejected).toHaveBeenCalled();
    expect(mockSyncNow).not.toHaveBeenCalled();
  });
});
