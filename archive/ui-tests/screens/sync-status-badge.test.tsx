/**
 * SyncStatusBadge tests — covers the P1D-M4 C18 variants (online,
 * syncing/connecting, offline with retry, cloud, and local hidden)
 * with the ADR-039 AppMode enum.
 */

import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SyncStatusBadge } from '../../src/screens/AppShell/sync-status-badge';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function renderBadge(node: ReactElement) {
  return renderWithProviders(node);
}

describe('SyncStatusBadge', () => {
  it('renders nothing in local mode', () => {
    renderBadge(<SyncStatusBadge mode="local" />);
    expect(screen.queryByTestId('sync-status-badge')).toBeNull();
  });

  it('renders nothing when mode is null (pre-wizard)', () => {
    renderBadge(<SyncStatusBadge mode={null} />);
    expect(screen.queryByTestId('sync-status-badge')).toBeNull();
  });

  it('renders the cloud badge in cloud mode', () => {
    renderBadge(<SyncStatusBadge mode="cloud" />);
    expect(screen.getByTestId('sync-status-badge').textContent).toMatch(/nube/i);
  });

  it('renders "N dispositivos" for the online LAN-server status', () => {
    renderBadge(<SyncStatusBadge mode="lan-server" lanStatus="online" connectedDevices={3} />);
    expect(screen.getByTestId('sync-status-badge').textContent).toMatch(/3/);
  });

  it('renders "N dispositivos" for the online LAN-client status', () => {
    renderBadge(<SyncStatusBadge mode="lan-client" lanStatus="online" connectedDevices={2} />);
    expect(screen.getByTestId('sync-status-badge').textContent).toMatch(/2/);
  });

  it('renders "Sincronizando…" for the connecting status', () => {
    renderBadge(<SyncStatusBadge mode="lan-client" lanStatus="connecting" connectedDevices={0} />);
    expect(screen.getByTestId('sync-status-badge').textContent).toMatch(/sincronizando/i);
  });

  it('renders "Sin conexión" + retry button for offline with onRetry', () => {
    const onRetry = vi.fn();
    renderBadge(
      <SyncStatusBadge
        mode="lan-client"
        lanStatus="offline"
        connectedDevices={0}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByTestId('sync-status-badge').textContent).toMatch(/sin conexión/i);
    expect(screen.getByTestId('sync-status-retry')).not.toBeNull();
  });

  it('does NOT render a retry button when onRetry is omitted', () => {
    renderBadge(<SyncStatusBadge mode="lan-client" lanStatus="offline" connectedDevices={0} />);
    expect(screen.queryByTestId('sync-status-retry')).toBeNull();
  });
});
