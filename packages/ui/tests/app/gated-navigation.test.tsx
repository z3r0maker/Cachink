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
import type { BusinessId } from '@cachink/domain';
import { GatedNavigation, MockRepositoryProvider } from '../../src/app/index';
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

function mountGate(children: ReactElement): ReturnType<typeof renderWithProviders> {
  // Local QueryClient so each test gets a fresh cache.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return renderWithProviders(
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>
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
      mode: 'local-standalone',
      currentBusinessId: null,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(screen.queryByTestId('app-body')).toBeNull();
    expect(screen.getByTestId('business-form')).toBeInTheDocument();
  });

  it('shows the role picker when mode + business exist but role is null', () => {
    setStore({
      hydrated: true,
      mode: 'local-standalone',
      currentBusinessId: '01JPHK0000000000000000000B' as BusinessId,
      role: null,
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(screen.queryByTestId('app-body')).toBeNull();
    expect(screen.getByTestId('role-picker')).toBeInTheDocument();
  });

  it('renders children when every gate is satisfied', () => {
    setStore({
      hydrated: true,
      mode: 'local-standalone',
      currentBusinessId: '01JPHK0000000000000000000B' as BusinessId,
      role: 'operativo',
      deviceId: null,
    });
    mountGate(<span data-testid="app-body">app</span>);
    expect(screen.getByTestId('app-body')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard')).toBeNull();
    expect(screen.queryByTestId('role-picker')).toBeNull();
  });
});
