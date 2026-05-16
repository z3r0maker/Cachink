/**
 * useIsrDefaults / useUpdateIsrDefaults hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryAppConfigRepository } from '@cachink/testing';
import { ISR_DEFAULTS_SEED } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useIsrDefaults, useUpdateIsrDefaults } from '../../src/hooks/use-isr-defaults';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } } });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useIsrDefaults', () => {
  let appConfig: InMemoryAppConfigRepository;

  beforeEach(() => {
    appConfig = new InMemoryAppConfigRepository();
    useAppConfigStore.setState({ hydrated: true });
  });

  it('returns ISR_DEFAULTS_SEED as initial data', () => {
    const { result } = renderHook(() => useIsrDefaults(), {
      wrapper: wrapper({ appConfig }),
    });
    // initialData provides seed values immediately
    expect(result.current.data).toEqual(ISR_DEFAULTS_SEED);
  });

  it('reads persisted ISR defaults from app config', async () => {
    const custom = { ...ISR_DEFAULTS_SEED, RIF: 200, 'Persona Física': 2500 };
    await appConfig.set('isrDefaults', JSON.stringify(custom));

    const { result } = renderHook(() => useIsrDefaults(), {
      wrapper: wrapper({ appConfig }),
    });

    await waitFor(() => expect(result.current.data?.RIF).toBe(200));
  });
});

describe('useUpdateIsrDefaults', () => {
  let appConfig: InMemoryAppConfigRepository;

  beforeEach(() => {
    appConfig = new InMemoryAppConfigRepository();
    useAppConfigStore.setState({ hydrated: true });
  });

  it('persists updated ISR defaults', async () => {
    const { result } = renderHook(() => useUpdateIsrDefaults(), {
      wrapper: wrapper({ appConfig }),
    });

    const next = { ...ISR_DEFAULTS_SEED, RIF: 500 };
    await act(async () => {
      result.current.mutate(next);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const stored = await appConfig.get('isrDefaults');
    expect(JSON.parse(stored!)).toEqual(next);
  });
});
