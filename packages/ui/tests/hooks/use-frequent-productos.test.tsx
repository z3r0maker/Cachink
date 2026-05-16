/**
 * useFrequentProductos hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useFrequentProductos } from '../../src/hooks/use-frequent-productos';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const TODAY = new Date().toISOString().slice(0, 10) as IsoDate;

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

describe('useFrequentProductos', () => {
  let products: InMemoryProductsRepository;
  let sales: InMemorySalesRepository;

  beforeEach(() => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns most-sold products', async () => {
    const p1 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'A' }));
    const p2 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'B' }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p1.id, fecha: TODAY }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p2.id, fecha: TODAY }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p2.id, fecha: TODAY }));

    const { result } = renderHook(() => useFrequentProductos(), {
      wrapper: wrapper({ products, sales }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.length).toBeGreaterThanOrEqual(1);
    // p2 sold more, should come first
    expect(result.current.data![0]!.id).toBe(p2.id);
  });

  it('falls back to newest products when no sales exist', async () => {
    await products.create(makeNewProduct({ businessId: BIZ, nombre: 'Solo' }));

    const { result } = renderHook(() => useFrequentProductos(), {
      wrapper: wrapper({ products, sales }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useFrequentProductos(), {
      wrapper: wrapper({ products, sales }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
