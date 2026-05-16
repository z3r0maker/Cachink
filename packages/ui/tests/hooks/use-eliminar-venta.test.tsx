/**
 * useEliminarVenta hook tests.
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
import type { BusinessId, IsoDate, SaleId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEliminarVenta } from '../../src/hooks/use-eliminar-venta';
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

describe('useEliminarVenta', () => {
  let sales: InMemorySalesRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('soft-deletes a sale via the mutation', async () => {
    const product = await products.create(
      makeNewProduct({ businessId: BIZ }),
    );
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ, productoId: product.id }),
    );

    const { result } = renderHook(() => useEliminarVenta(), {
      wrapper: wrapper({ sales }),
    });

    await act(async () => {
      result.current.mutate({ id: sale.id, fecha: sale.fecha });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(await sales.findById(sale.id)).toBeNull();
  });

  it('succeeds silently when the sale does not exist', async () => {
    const { result } = renderHook(() => useEliminarVenta(), {
      wrapper: wrapper({ sales }),
    });

    await act(async () => {
      result.current.mutate({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as SaleId,
        fecha: '2026-05-09' as IsoDate,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
