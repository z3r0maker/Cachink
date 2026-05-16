/**
 * useEditarVenta hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, SaleId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEditarVenta } from '../../src/hooks/use-editar-venta';
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

describe('useEditarVenta', () => {
  let sales: InMemorySalesRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('updates a sale via the mutation', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ, productoId: product.id, concepto: 'Original' }),
    );

    const { result } = renderHook(() => useEditarVenta(), {
      wrapper: wrapper({ sales }),
    });

    await act(async () => {
      result.current.mutate({ id: sale.id, patch: { concepto: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.concepto).toBe('Updated');
  });

  it('returns error when sale does not exist', async () => {
    const { result } = renderHook(() => useEditarVenta(), {
      wrapper: wrapper({ sales }),
    });

    await act(async () => {
      result.current.mutate({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as SaleId,
        patch: { concepto: 'Nope' },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
