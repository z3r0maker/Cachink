/**
 * GatedNavigation state-machine tests (P1C C9, closes M1).
 *
 * Verifies the branch table the boot flow depends on: hydration pending,
 * then wizard, then business form, then role picker, then children. The
 * gate is context-driven — we skip the AppConfigProvider's async
 * hydration by pre-setting the Zustand store in each test.
 */

import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import type { BusinessId, UserId } from '@cachink/domain';
import type { Repositories } from '../../src/app/repository-provider';
import { GatedNavigation } from '../../src/app/index';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryAppConfigRepository,
  InMemoryUsersRepository,
} from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

initI18n();

function setStore(state: Partial<ReturnType<typeof useAppConfigStore.getState>>): void {
  act(() => {
    useAppConfigStore.setState({ ...state });
  });
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

  it('shows the wizard when mode is null', () => {
    setStore({
      hydrated: true,
      mode: null,
      currentBusinessId: null,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(screen.queryByTestId('app-body')).toBeNull();
    expect(screen.getByTestId('wizard')).toBeInTheDocument();
  });

  it('shows the business form when mode is set but no business exists', () => {
    setStore({
      hydrated: true,
      mode: 'local',
      currentBusinessId: null,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(screen.queryByTestId('app-body')).toBeNull();
    expect(screen.getByTestId('business-form')).toBeInTheDocument();
  });

  it('shows the director setup when mode + business exist but no users', async () => {
    setStore({
      hydrated: true,
      mode: 'local',
      currentBusinessId: '01JPHK0000000000000000000B' as BusinessId,
      userId: null,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    // With no users in the mock repo, the auth gate shows DirectorSetupGate
    const setup = await screen.findByTestId('director-setup');
    expect(setup).toBeInTheDocument();
    expect(screen.queryByTestId('app-body')).toBeNull();
  });

  it('renders children when every gate is satisfied', async () => {
    // Seed users repo so AuthInner sees hasUsers=true
    const users = new InMemoryUsersRepository();
    await users.create({
      nombre: 'Test Director',
      email: null,
      pinHash: 'hash',
      recoveryPasswordHash: 'pin',
      role: 'director',
      mustChangePin: false,
      businessId: '01JPHK0000000000000000000B' as BusinessId,
    });

    // Seed appConfig with discoveryShown so FeatureDiscoveryGate passes through
    const appConfig = new InMemoryAppConfigRepository();
    await appConfig.set('discoveryShown', 'true');

    setStore({
      hydrated: true,
      mode: 'local',
      currentBusinessId: '01JPHK0000000000000000000B' as BusinessId,
      userId: '01JPHK0000000000000000USR1' as UserId,
      role: 'operativo',
      mustChangePin: false,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>, { users, appConfig });
    // AuthInner resolves users from the query — when userId is set +
    // mustChangePin is false, children render.
    const body = await screen.findByTestId('app-body');
    expect(body).toBeInTheDocument();
    expect(screen.queryByTestId('wizard')).toBeNull();
    expect(screen.queryByTestId('director-setup')).toBeNull();
  });
});
