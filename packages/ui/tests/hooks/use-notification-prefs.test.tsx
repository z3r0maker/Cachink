/**
 * useNotificationPrefs / useUpdateNotificationPrefs / useEffectiveNotificationPrefs tests.
 * Phase 11 — Director Notification Inbox.
 *
 * Uses a direct RepositoryProvider wrapper (not MockRepositoryProvider) to
 * avoid the @cachink/observability transitive import chain.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InMemoryAppConfigRepository, InMemoryBusinessesRepository, TEST_DEVICE_ID } from '@cachink/testing';
import {
  deriveDefaultPrefs,
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
  type NotificationPreferences,
} from '@cachink/domain';
import type { BusinessId } from '@cachink/domain';
import { RepositoryProvider, type Repositories } from '../../src/app/repository-provider';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
  useEffectiveNotificationPrefs,
} from '../../src/hooks/use-notification-prefs';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

/**
 * Minimal wrapper that only provides the repos needed by the hooks under test.
 * Avoids the full MockRepositoryProvider → app-providers → @cachink/observability chain.
 */
function wrapper(repos: Partial<Repositories>) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  // Fill in any missing repos with stubs — only appConfig + businesses are used
  const fullRepos = {
    appConfig: repos.appConfig ?? new InMemoryAppConfigRepository(),
    businesses: repos.businesses ?? new InMemoryBusinessesRepository(TEST_DEVICE_ID),
  } as unknown as Repositories;

  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <RepositoryProvider repositories={fullRepos}>
          {children}
        </RepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useNotificationPrefs', () => {
  let appConfig: InMemoryAppConfigRepository;

  beforeEach(() => {
    appConfig = new InMemoryAppConfigRepository();
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns default prefs derived from feature flags when no config exists', () => {
    const { result } = renderHook(() => useNotificationPrefs(), {
      wrapper: wrapper({ appConfig }),
    });
    const defaults = deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS);
    expect(result.current.data).toEqual(defaults);
  });

  it('reads stored prefs from AppConfig when they exist', async () => {
    const custom: NotificationPreferences = {
      ...deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS),
      'stock-bajo': false,
      'caja-discrepancia': false,
    };
    await appConfig.set('notificationPrefs', JSON.stringify(custom));

    const { result } = renderHook(() => useNotificationPrefs(), {
      wrapper: wrapper({ appConfig }),
    });

    await waitFor(() => {
      expect(result.current.data?.['stock-bajo']).toBe(false);
      expect(result.current.data?.['caja-discrepancia']).toBe(false);
    });
  });

  it('falls back to defaults when AppConfig contains invalid JSON', async () => {
    await appConfig.set('notificationPrefs', '{not valid json!');

    const { result } = renderHook(() => useNotificationPrefs(), {
      wrapper: wrapper({ appConfig }),
    });

    const defaults = deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS);
    // Should fall back gracefully on parse error
    await waitFor(() => {
      expect(result.current.data).toEqual(defaults);
    });
  });

  it('falls back to defaults when schema validation fails', async () => {
    // Store a value that parses as JSON but fails Zod validation
    await appConfig.set('notificationPrefs', JSON.stringify({ bogus: 'bad' }));

    const { result } = renderHook(() => useNotificationPrefs(), {
      wrapper: wrapper({ appConfig }),
    });

    const defaults = deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS);
    await waitFor(() => {
      expect(result.current.data).toEqual(defaults);
    });
  });
});

describe('useUpdateNotificationPrefs', () => {
  let appConfig: InMemoryAppConfigRepository;

  beforeEach(() => {
    appConfig = new InMemoryAppConfigRepository();
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('persists updated prefs to AppConfig', async () => {
    const { result } = renderHook(() => useUpdateNotificationPrefs(), {
      wrapper: wrapper({ appConfig }),
    });

    const next: NotificationPreferences = {
      ...deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS),
      'stock-bajo': false,
    };

    await act(async () => {
      result.current.mutate(next);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const stored = await appConfig.get('notificationPrefs');
    expect(JSON.parse(stored!)).toEqual(next);
  });

  it('invalidates the prefs query so reads reflect the write', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
    });
    const fullRepos = {
      appConfig,
      businesses: new InMemoryBusinessesRepository(TEST_DEVICE_ID),
    } as unknown as Repositories;
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={qc}>
          <RepositoryProvider repositories={fullRepos}>
            {children}
          </RepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    );

    // First read — should get defaults
    const { result: readResult } = renderHook(() => useNotificationPrefs(), {
      wrapper: Wrapper,
    });
    expect(readResult.current.data?.['stock-bajo']).toBe(true);

    // Now write an update
    const { result: writeResult } = renderHook(
      () => useUpdateNotificationPrefs(),
      { wrapper: Wrapper },
    );

    const next: NotificationPreferences = {
      ...deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS),
      'stock-bajo': false,
    };
    await act(async () => {
      writeResult.current.mutate(next);
    });

    await waitFor(() => expect(writeResult.current.isSuccess).toBe(true));

    // Read should now reflect updated value
    await waitFor(() => {
      expect(readResult.current.data?.['stock-bajo']).toBe(false);
    });
  });
});

describe('useEffectiveNotificationPrefs', () => {
  let appConfig: InMemoryAppConfigRepository;
  let businesses: InMemoryBusinessesRepository;

  beforeEach(() => {
    appConfig = new InMemoryAppConfigRepository();
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('forces feature-gated sources OFF when their feature flag is OFF', async () => {
    // Store prefs with credito sources ON
    const stored: NotificationPreferences = {
      ...deriveDefaultPrefs(DEFAULT_FEATURE_FLAGS),
      'credito-entrega': true,
      'credito-vencido': true,
    };
    await appConfig.set('notificationPrefs', JSON.stringify(stored));

    // Create business with ventasCredito OFF
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, ventasCredito: false };
    const biz = await businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RIF',
      isrTasa: 3000,
      businessId: BIZ,
      featureFlags: JSON.stringify(flags),
    });
    useAppConfigStore.setState({ currentBusinessId: biz.id });

    const { result } = renderHook(() => useEffectiveNotificationPrefs(), {
      wrapper: wrapper({ appConfig, businesses }),
    });

    await waitFor(() => {
      // Feature-gated sources should be forced OFF
      expect(result.current['credito-entrega']).toBe(false);
      expect(result.current['credito-vencido']).toBe(false);
      // Non-gated sources remain ON
      expect(result.current['caja-discrepancia']).toBe(true);
    });
  });
});
