/**
 * useEditarProducto hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
} from '@cachink/testing';
import type { BusinessId, ProductId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEditarProducto } from '../../src/hooks/use-editar-producto';
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

describe('useEditarProducto', () => {
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('updates a product via the mutation', async () => {
    const product = await products.create(
      makeNewProduct({ businessId: BIZ, nombre: 'Original' }),
    );

    const { result } = renderHook(() => useEditarProducto(), {
      wrapper: wrapper({ products }),
    });

    await act(async () => {
      result.current.mutate({ id: product.id, patch: { nombre: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Updated');
  });

  it('returns error when product does not exist', async () => {
    const { result } = renderHook(() => useEditarProducto(), {
      wrapper: wrapper({ products }),
    });

    await act(async () => {
      result.current.mutate({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ProductId,
        patch: { nombre: 'Nope' },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
