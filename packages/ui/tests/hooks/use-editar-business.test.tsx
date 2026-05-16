/**
 * useEditarBusiness hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryBusinessesRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEditarBusiness } from '../../src/hooks/use-editar-business';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

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

describe('useEditarBusiness', () => {
  let businesses: InMemoryBusinessesRepository;

  beforeEach(async () => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    const biz = await businesses.create({
      nombre: 'Original',
      regimenFiscal: 'RIF',
      isrTasa: 3000,
      businessId: BIZ,
    });
    useAppConfigStore.setState({ currentBusinessId: biz.id, hydrated: true });
  });

  it('updates business details via the mutation', async () => {
    const bizId = useAppConfigStore.getState().currentBusinessId!;
    const { result } = renderHook(() => useEditarBusiness(), {
      wrapper: wrapper({ businesses }),
    });

    await act(async () => {
      result.current.mutate({
        id: bizId as BusinessId,
        patch: { nombre: 'Updated Taquería' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Updated Taquería');
  });
});
