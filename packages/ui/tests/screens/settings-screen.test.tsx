/**
 * Device-only Configuración (A-12): sections, plan from the verified
 * entitlement, "Desvincular" forgets identity but keeps data, the sync
 * section leads to "No enviados" only when something was refused, and the
 * aviso and términos open xangarro.mx in the browser (5.1.1(i)).
 */

import { act, type ReactNode } from 'react';
import { Linking } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import type * as DataModule from '@xangarro/data';
import type { XangarroDatabase } from '@xangarro/data';
import { activateTestDevice } from '../activated-device';
import { DatabaseContext } from '../../src/database/index';
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

const wipeLocalData = vi.fn(async () => ({ tables: 20, compacted: true }));
vi.mock('@xangarro/data', async (importOriginal) => ({
  ...(await importOriginal<typeof DataModule>()),
  wipeLocalData: () => wipeLocalData(),
}));

vi.mock('../../src/app/cloud-sync-bridge', () => ({
  CLOUD_SYNC_QUERY_KEY: ['cloudSync'],
  useCloudSync: () => mockSync,
}));
let mockSync = {
  state: {
    phase: 'idle',
    counts: { pending: 0, rejected: 0, retrying: 0, unsent: 0 },
    lastSyncAt: null,
  },
  syncNow: vi.fn(),
  contar: vi.fn(async () => mockSync.state.counts),
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

async function mount(opts: { rejected?: number; unsent?: number } = {}) {
  wipeLocalData.mockClear();
  mockSync = {
    ...mockSync,
    state: {
      ...mockSync.state,
      counts: {
        pending: 0,
        rejected: opts.rejected ?? 0,
        retrying: 0,
        unsent: opts.unsent ?? 0,
      },
    },
  };
  const appConfig = new InMemoryAppConfigRepository();
  await seedTestEntitlement(appConfig, 'xangarro');
  await activateTestDevice(appConfig);
  const tokenStore = memoryTokenStore('tok');
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const onOpenRejected = vi.fn();
  const restartApp = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <DatabaseContext.Provider value={{} as XangarroDatabase}>
        <MockRepositoryProvider overrides={{ appConfig }}>
          <ActivationProvider config={{ ...DEFAULT_ACTIVATION_CONFIG, tokenStore }}>
            {children}
          </ActivationProvider>
        </MockRepositoryProvider>
      </DatabaseContext.Provider>
    </QueryClientProvider>
  );
  renderWithProviders(
    <Wrapper>
      <SettingsScreen device={DEVICE} onOpenRejected={onOpenRejected} restartApp={restartApp} />
    </Wrapper>,
  );
  return { appConfig, tokenStore, onOpenRejected, restartApp };
}

describe('SettingsScreen (A-12)', () => {
  it('shows only device sections and never a plan name (ADR-069)', async () => {
    await mount();
    for (const id of ['settings-account', 'settings-sync', 'settings-device', 'settings-privacy']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('settings-data')).toBeNull();
    expect(screen.queryByTestId('settings-plan')).toBeNull();
    expect(screen.queryByTestId('settings-re-run-wizard')).toBeNull();
  });

  it('"Solo desvincular" clears the token and activation record after confirming', async () => {
    const { appConfig, tokenStore } = await mount();
    fireEvent.click(screen.getByTestId('settings-unlink'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('unlink-confirm'));
    });
    await waitFor(async () => expect(await tokenStore.get()).toBeNull());
    expect(await appConfig.get('activation')).toBeNull();
    // Data stays: the entitlement (and every record) is untouched.
    expect(await appConfig.get('entitlement')).not.toBeNull();
    expect(wipeLocalData).not.toHaveBeenCalled();
  });

  it('"Desvincular y borrar" wipes, leaves the «Listo» flag and restarts', async () => {
    const { appConfig, tokenStore, restartApp } = await mount();
    fireEvent.click(screen.getByTestId('settings-unlink'));
    fireEvent.click(screen.getByTestId('option-card-borrar'));
    expect(screen.getByTestId('unlink-todo-enviado')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId('unlink-confirm'));
    });
    await waitFor(() => expect(restartApp).toHaveBeenCalled());
    expect(wipeLocalData).toHaveBeenCalledTimes(1);
    expect(await tokenStore.get()).toBeNull();
    expect(await appConfig.get('avisoBorrado')).not.toBeNull();
  });

  it('will not wipe while records are unsent, and offers to send them', async () => {
    const { tokenStore } = await mount({ unsent: 3 });
    fireEvent.click(screen.getByTestId('settings-unlink'));
    fireEvent.click(screen.getByTestId('option-card-borrar'));
    expect(screen.getByTestId('unlink-sin-enviar')).toHaveTextContent('Registros sin enviar: 3.');
    await act(async () => {
      fireEvent.click(screen.getByTestId('unlink-confirm'));
    });
    expect(wipeLocalData).not.toHaveBeenCalled();
    expect(await tokenStore.get()).toBe('tok');
    fireEvent.click(screen.getByTestId('unlink-enviar'));
    expect(mockSync.syncNow).toHaveBeenCalled();
  });

  it('sends refused records to «No enviados» instead of «Enviar ahora»', async () => {
    const { onOpenRejected } = await mount({ rejected: 1 });
    fireEvent.click(screen.getByTestId('settings-unlink'));
    fireEvent.click(screen.getByTestId('option-card-borrar'));
    expect(screen.queryByTestId('unlink-enviar')).toBeNull();
    fireEvent.click(screen.getByTestId('unlink-ver-no-enviados'));
    expect(onOpenRejected).toHaveBeenCalled();
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

  it('opens the aviso and the términos on xangarro.mx, not the portal', async () => {
    const open = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await mount();
    fireEvent.click(screen.getByTestId('settings-aviso-privacidad'));
    fireEvent.click(screen.getByTestId('settings-terminos'));
    expect(open.mock.calls).toEqual([
      ['https://xangarro.mx/privacidad/'],
      ['https://xangarro.mx/terminos/'],
    ]);
    open.mockRestore();
  });
});
