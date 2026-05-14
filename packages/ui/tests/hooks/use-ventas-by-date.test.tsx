/**
 * useVentasByDate hook tests.
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
import { useVentasByDate } from '../../src/hooks/use-ventas-by-date';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DATE = '2026-05-09' as IsoDate;

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

describe('useVentasByDate', () => {
  let sales: InMemorySalesRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns sales for the given date', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    await sales.create(makeNewSale({ businessId: BIZ, fecha: DATE, productoId: product.id }));
    await sales.create(makeNewSale({ businessId: BIZ, fecha: '2026-05-10' as IsoDate, productoId: product.id }));

    const { result } = renderHook(() => useVentasByDate(DATE), {
      wrapper: wrapper({ sales }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.fecha).toBe(DATE);
  });

  it('returns empty array when no sales exist', async () => {
    const { result } = renderHook(() => useVentasByDate(DATE), {
      wrapper: wrapper({ sales }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useVentasByDate(DATE), {
      wrapper: wrapper({ sales }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
