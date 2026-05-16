/**
 * useCurrentBusiness hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryBusinessesRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCurrentBusiness } from '../../src/hooks/use-current-business';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useCurrentBusiness', () => {
  let businesses: InMemoryBusinessesRepository;

  beforeEach(() => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
  });

  it('returns the business when it exists', async () => {
    const biz = await businesses.create({
      nombre: 'Taquería',
      regimenFiscal: 'RIF',
      isrTasa: 3000,
      businessId: BIZ,
    });
    useAppConfigStore.setState({ currentBusinessId: biz.id, hydrated: true });

    const { result } = renderHook(() => useCurrentBusiness(), {
      wrapper: wrapper({ businesses }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Taquería');
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null, hydrated: true });
    const { result } = renderHook(() => useCurrentBusiness(), {
      wrapper: wrapper({ businesses }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
