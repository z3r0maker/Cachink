/**
 * Wizard safety-rail tests (ADR-039 — M3.4):
 *   - DataPreservedCallout shows/hides based on data counts + mode
 *   - OfflineBlocker swaps in for cloud sub-flow when offline
 *   - UnsyncedBlocker blocks mode change when push HWM > 0 + force escape
 *   - ConfirmModeChangeModal interpolates the mode name correctly
 */

import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing';
import {
  ConfirmModeChangeModal,
  DataPreservedCallout,
  OfflineBlocker,
  UnsyncedBlocker,
  useWizardStore,
} from '../../src/screens/index';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

// --- useIsOnline mock ---
let MOCK_ONLINE = true;
vi.mock('../../src/hooks/use-is-online', () => ({
  useIsOnline: () => MOCK_ONLINE,
}));

// --- usePendingChanges mock ---
let MOCK_PENDING = 0;
vi.mock('../../src/hooks/use-pending-changes', () => ({
  usePendingChanges: () => ({ count: MOCK_PENDING, loading: false }),
}));

// --- useDataCounts mock ---
let MOCK_COUNTS = {
  ventas: 0,
  productos: 0,
  clientes: 0,
  hasAny: false,
};
vi.mock('../../src/hooks/use-data-counts', () => ({
  useDataCounts: () => ({ counts: MOCK_COUNTS, loading: false }),
}));

afterEach(() => {
  useWizardStore.getState().reset();
  useAppConfigStore.getState().reset();
  MOCK_ONLINE = true;
  MOCK_PENDING = 0;
  MOCK_COUNTS = { ventas: 0, productos: 0, clientes: 0, hasAny: false };
});

function withProviders(node: ReactElement): ReactNode {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>{node}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('DataPreservedCallout', () => {
  it('renders nothing when hasAny === false (first run)', () => {
    MOCK_COUNTS = { ventas: 0, productos: 0, clientes: 0, hasAny: false };
    renderWithProviders(withProviders(<DataPreservedCallout />));
    expect(screen.queryByTestId('wizard-data-preserved-callout')).toBeNull();
  });

  it('renders the count-interpolated body when hasAny === true', () => {
    MOCK_COUNTS = { ventas: 12, productos: 4, clientes: 3, hasAny: true };
    renderWithProviders(withProviders(<DataPreservedCallout />));
    const node = screen.getByTestId('wizard-data-preserved-callout');
    expect(node.textContent).toContain('12');
    expect(node.textContent).toContain('4');
    expect(node.textContent).toContain('3');
  });

  it('renders the cloud-specific body when mode === cloud', () => {
    MOCK_COUNTS = { ventas: 1, productos: 1, clientes: 1, hasAny: true };
    useAppConfigStore.getState().setMode('cloud');
    renderWithProviders(withProviders(<DataPreservedCallout />));
    const node = screen.getByTestId('wizard-data-preserved-callout');
    expect(node.textContent).toMatch(/nube/i);
  });
});

describe('OfflineBlocker', () => {
  it('renders the child when online', () => {
    MOCK_ONLINE = true;
    renderWithProviders(
      withProviders(
        <OfflineBlocker onBack={vi.fn()}>
          <span data-testid="cloud-flow">cloud</span>
        </OfflineBlocker>,
      ),
    );
    expect(screen.getByTestId('cloud-flow')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-offline-blocker')).toBeNull();
  });

  it('replaces the child with a warning callout when offline', () => {
    MOCK_ONLINE = false;
    renderWithProviders(
      withProviders(
        <OfflineBlocker onBack={vi.fn()}>
          <span data-testid="cloud-flow">cloud</span>
        </OfflineBlocker>,
      ),
    );
    expect(screen.queryByTestId('cloud-flow')).toBeNull();
    expect(screen.getByTestId('wizard-offline-blocker')).toBeInTheDocument();
  });

  it('back button fires onBack', () => {
    MOCK_ONLINE = false;
    const onBack = vi.fn();
    renderWithProviders(
      withProviders(
        <OfflineBlocker onBack={onBack}>
          <span>cloud</span>
        </OfflineBlocker>,
      ),
    );
    fireEvent.click(screen.getByTestId('wizard-offline-blocker-back'));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('UnsyncedBlocker', () => {
  it('renders the child when no pending changes', () => {
    MOCK_PENDING = 0;
    renderWithProviders(
      withProviders(
        <UnsyncedBlocker>
          <span data-testid="next">next</span>
        </UnsyncedBlocker>,
      ),
    );
    expect(screen.getByTestId('next')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-unsynced-blocker')).toBeNull();
  });

  it('shows the warning when pending count > 0', () => {
    MOCK_PENDING = 5;
    renderWithProviders(
      withProviders(
        <UnsyncedBlocker>
          <span data-testid="next">next</span>
        </UnsyncedBlocker>,
      ),
    );
    expect(screen.queryByTestId('next')).toBeNull();
    expect(screen.getByTestId('wizard-unsynced-blocker')).toBeInTheDocument();
  });

  it('force-confirm flips the store flag and lets the child render', () => {
    MOCK_PENDING = 5;
    renderWithProviders(
      withProviders(
        <UnsyncedBlocker>
          <span data-testid="next">next</span>
        </UnsyncedBlocker>,
      ),
    );
    fireEvent.click(screen.getByTestId('wizard-unsynced-force-cta'));
    expect(useWizardStore.getState().forceModeChange).toBe(true);
    expect(screen.getByTestId('next')).toBeInTheDocument();
  });
});

describe('ConfirmModeChangeModal', () => {
  it('renders mode name in the title and confirm button', () => {
    renderWithProviders(
      withProviders(
        <ConfirmModeChangeModal open mode="lan-server" onConfirm={vi.fn()} onCancel={vi.fn()} />,
      ),
    );
    const modal = screen.getByTestId('wizard-confirm-mode-change');
    expect(modal.textContent).toContain('Servidor del negocio');
  });

  it('confirm fires onConfirm', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      withProviders(
        <ConfirmModeChangeModal open mode="cloud" onConfirm={onConfirm} onCancel={vi.fn()} />,
      ),
    );
    fireEvent.click(screen.getByTestId('wizard-confirm-mode-change-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('cancel fires onCancel', () => {
    const onCancel = vi.fn();
    renderWithProviders(
      withProviders(
        <ConfirmModeChangeModal open mode="cloud" onConfirm={vi.fn()} onCancel={onCancel} />,
      ),
    );
    fireEvent.click(screen.getByTestId('wizard-confirm-mode-change-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
