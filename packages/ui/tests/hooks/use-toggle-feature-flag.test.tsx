/**
 * useToggleFeatureFlag hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryBusinessesRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { DEFAULT_FEATURE_FLAGS } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useToggleFeatureFlag } from '../../src/hooks/use-toggle-feature-flag';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(
  overrides?: Record<string, unknown>,
): (props: { children: ReactNode }) => ReactNode {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={qc}>
          <MockRepositoryProvider overrides={overrides}>
            {children}
          </MockRepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    );
  };
}

describe('useToggleFeatureFlag', () => {
  let businesses: InMemoryBusinessesRepository;

  beforeEach(async () => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    const biz = await businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RIF',
      isrTasa: 0.3,
      businessId: BIZ,
      featureFlags: JSON.stringify(DEFAULT_FEATURE_FLAGS),
    });
    useAppConfigStore.setState({ currentBusinessId: biz.id, hydrated: true });
  });

  it('toggles a flag via the mutation', async () => {
    const { result } = renderHook(() => useToggleFeatureFlag(), {
      wrapper: wrapper({ businesses }),
    });

    await act(async () => {
      result.current.mutate({ key: 'caja', newValue: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.caja).toBe(true);
    // Other flags should remain at defaults
    expect(result.current.data?.stock).toBe(true);
  });

  it('throws when no business is configured', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useToggleFeatureFlag(), {
      wrapper: wrapper({ businesses }),
    });

    await act(async () => {
      result.current.mutate({ key: 'merma', newValue: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('no current business');
  });
});
