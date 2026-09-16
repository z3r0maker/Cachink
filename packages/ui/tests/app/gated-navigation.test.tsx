/**
 * GatedNavigation state-machine tests (P1C C9, closes M1).
 *
 * Verifies the branch table the boot flow depends on: hydration pending,
 * then activation (A-04), then operator sign-in (A-05), then children. The
 * gate is context-driven — we skip the AppConfigProvider's async
 * hydration by pre-setting the Zustand store in each test.
 */

import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import type { BusinessId, UserId } from '@xangarro/domain';
import type { Repositories } from '../../src/app/repository-provider';
import { GatedNavigation } from '../../src/app/index';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { InMemoryAppConfigRepository, InMemoryUsersRepository } from '@xangarro/testing';
import { APP_CONFIG_KEYS, useAppConfigStore } from '../../src/app-config/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

initI18n();

function setStore(state: Partial<ReturnType<typeof useAppConfigStore.getState>>): void {
  act(() => {
    useAppConfigStore.setState({ ...state });
  });
}

const BIZ = '01JPHK0000000000000000000B' as BusinessId;

function signedOut(): Partial<ReturnType<typeof useAppConfigStore.getState>> {
  return {
    hydrated: true,
    mode: 'local',
    currentBusinessId: BIZ,
    userId: null,
    role: null,
    deviceId: null,
  };
}

async function usersWithOperator(active: boolean): Promise<InMemoryUsersRepository> {
  const users = new InMemoryUsersRepository();
  const toni = await users.create({
    nombre: 'Toni',
    email: null,
    pinHash: 'hash',
    recoveryPasswordHash: 'unused',
    role: 'operativo',
    mustChangePin: false,
    avatarColor: 'blue',
    businessId: BIZ,
  });
  if (!active) await users.update(toni.id, { active: false });
  return users;
}

/** A device that already redeemed an activation code (A-04 gate passes). */
async function activatedRepo(): Promise<InMemoryAppConfigRepository> {
  const appConfig = new InMemoryAppConfigRepository();
  await appConfig.set(
    APP_CONFIG_KEYS.activation,
    JSON.stringify({ deviceId: 'DEV', businessId: 'BIZ', activatedAt: '2026-09-16T00:00:00.000Z' }),
  );
  return appConfig;
}

function mountGate(
  children: ReactElement,
  overrides?: Partial<Repositories>,
): ReturnType<typeof renderWithProviders> {
  // Local QueryClient so each test gets a fresh cache.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return renderWithProviders(
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider overrides={overrides}>
        <GatedNavigation platform="mobile">{children}</GatedNavigation>
      </MockRepositoryProvider>
    </QueryClientProvider>,
  );
}

describe('GatedNavigation', () => {
  it('renders null while the store is not hydrated', () => {
    setStore({
      hydrated: false,
      mode: null,
      currentBusinessId: null,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(screen.queryByTestId('app-body')).toBeNull();
  });

  it('shows the activation screen on a device that was never activated', async () => {
    setStore({ hydrated: true, mode: null, currentBusinessId: null, role: null, deviceId: null });
    mountGate(<span data-testid="app-body">app</span>);
    expect(await screen.findByTestId('activation-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard')).toBeNull();
    expect(screen.queryByTestId('app-body')).toBeNull();
  });

  it('shows the activation screen even when a business already exists locally (prebeta installs start fresh, Q7)', async () => {
    setStore({
      hydrated: true,
      mode: 'local',
      currentBusinessId: '01JPHK0000000000000000000B' as BusinessId,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(await screen.findByTestId('activation-screen')).toBeInTheDocument();
  });

  it('asks for an operator and PIN once the device is activated', async () => {
    const users = await usersWithOperator(true);
    setStore(signedOut());
    mountGate(<span data-testid="app-body">app</span>, { users, appConfig: await activatedRepo() });
    expect(await screen.findByTestId('quick-switch')).toBeInTheDocument();
    expect(screen.getByText(/Toni/)).toBeInTheDocument();
    expect(screen.queryByTestId('app-body')).toBeNull();
  });

  it('explains where operators come from when none is active yet', async () => {
    const users = await usersWithOperator(false);
    setStore(signedOut());
    mountGate(<span data-testid="app-body">app</span>, { users, appConfig: await activatedRepo() });
    expect(await screen.findByTestId('quick-switch-empty')).toBeInTheDocument();
    expect(screen.getByTestId('quick-switch-refresh')).toBeInTheDocument();
  });

  it('never shows the retired first-run screens', async () => {
    setStore({ ...signedOut(), mode: null, currentBusinessId: BIZ });
    mountGate(<span data-testid="app-body">app</span>, { appConfig: await activatedRepo() });
    expect(await screen.findByTestId('quick-switch-empty')).toBeInTheDocument();
    for (const id of ['wizard', 'feature-discovery', 'business-form', 'director-setup']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
  });

  it('renders children when an operator is signed in', async () => {
    const users = await usersWithOperator(true);
    setStore({ ...signedOut(), userId: '01JPHK0000000000000000USR1' as UserId });
    mountGate(<span data-testid="app-body">app</span>, { users, appConfig: await activatedRepo() });
    expect(await screen.findByTestId('app-body')).toBeInTheDocument();
  });
});
