/**
 * useDataCounts hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryClientsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewClient,
  makeNewProduct,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useDataCounts } from '../../src/hooks/use-data-counts';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(
  overrides?: Record<string, unknown>,
): (props: { children: ReactNode }) => ReactNode {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
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

describe('useDataCounts', () => {
  let sales: InMemorySalesRepository;
  let products: InMemoryProductsRepository;
  let clients: InMemoryClientsRepository;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns zero counts when no data exists', async () => {
    const { result } = renderHook(() => useDataCounts(), {
      wrapper: wrapper({ sales, products, clients }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts).toEqual({
      ventas: 0,
      productos: 0,
      clientes: 0,
      hasAny: false,
    });
  });

  it('returns correct counts when data exists', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: product.id }));
    await clients.create(makeNewClient({ businessId: BIZ }));

    const { result } = renderHook(() => useDataCounts(), {
      wrapper: wrapper({ sales, products, clients }),
    });

    await waitFor(() => expect(result.current.counts.hasAny).toBe(true));
    expect(result.current.counts.ventas).toBe(1);
    expect(result.current.counts.productos).toBe(1);
    expect(result.current.counts.clientes).toBe(1);
  });

  it('returns zero counts when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useDataCounts(), {
      wrapper: wrapper({ sales, products, clients }),
    });
    expect(result.current.counts.hasAny).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});
