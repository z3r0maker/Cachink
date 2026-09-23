/**
 * Device-only Configuración (A-12): sections, plan from the verified
 * entitlement, "Desvincular" forgets identity but keeps data, and the sync
 * section leads to "No enviados" only when something was refused.
 */

import { act, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { InMemoryAppConfigRepository, seedTestEntitlement } from '@xangarro/testing';
import { ActivationProvider } from '../../src/activation/activation-context';
import {
  DEFAULT_ACTIVATION_CONFIG,
  memoryTokenStore,
} from '../../src/activation/activation-config';
import { SettingsScreen, type DeviceSettings } from '../../src/screens/Settings/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

vi.mock('../../src/app/cloud-sync-bridge', () => ({
  CLOUD_SYNC_QUERY_KEY: ['cloudSync'],
  useCloudSync: () => mockSync,
}));
let mockSync = {
  state: { phase: 'idle', counts: { pending: 0, rejected: 0, retrying: 0 }, lastSyncAt: null },
  syncNow: vi.fn(),
};

const DEVICE: DeviceSettings = {
  soundEnabled: true,
  onSoundChange: vi.fn(),
  notificationsEnabled: true,
  onNotificationsChange: vi.fn(),
  crashReportingEnabled: false,
  onCrashReportingChange: vi.fn(),
  onReportProblem: vi.fn(),
};

async function mount(opts: { rejected?: number } = {}) {
  mockSync = {
    ...mockSync,
    state: { ...mockSync.state, counts: { pending: 0, rejected: opts.rejected ?? 0, retrying: 0 } },
  };
  const appConfig = new InMemoryAppConfigRepository();
  await seedTestEntitlement(appConfig, 'xangarro');
  await appConfig.set('activation', '{"deviceId":"D","businessId":"B","activatedAt":"x"}');
  const tokenStore = memoryTokenStore('tok');
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const onOpenRejected = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider overrides={{ appConfig }}>
        <ActivationProvider config={{ ...DEFAULT_ACTIVATION_CONFIG, tokenStore }}>
          {children}
        </ActivationProvider>
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
  renderWithProviders(
    <Wrapper>
      <SettingsScreen device={DEVICE} onOpenRejected={onOpenRejected} />
    </Wrapper>,
  );
  return { appConfig, tokenStore, onOpenRejected };
}

describe('SettingsScreen (A-12)', () => {
  it('shows only device sections and never a plan name (ADR-069)', async () => {
    await mount();
    for (const id of ['settings-account', 'settings-sync', 'settings-device', 'settings-data']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('settings-plan')).toBeNull();
    expect(screen.queryByTestId('settings-re-run-wizard')).toBeNull();
  });

  it('"Desvincular" clears the token and activation record after confirming', async () => {
    const { appConfig, tokenStore } = await mount();
    fireEvent.click(screen.getByTestId('settings-unlink'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
    });
    await waitFor(async () => expect(await tokenStore.get()).toBeNull());
    expect(await appConfig.get('activation')).toBeNull();
    // Data stays: the entitlement (and every record) is untouched.
    expect(await appConfig.get('entitlement')).not.toBeNull();
  });

  it('offers "No enviados" only when rows were refused', async () => {
    await mount();
    expect(screen.queryByTestId('settings-no-enviados')).toBeNull();
  });

  it('opens "No enviados" from the sync section', async () => {
    const { onOpenRejected } = await mount({ rejected: 2 });
    fireEvent.click(screen.getByTestId('settings-no-enviados'));
    expect(onOpenRejected).toHaveBeenCalled();
  });
});
