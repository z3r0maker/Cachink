/**
 * useProductosConStock hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
} from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useProductosConStock } from '../../src/hooks/use-productos-con-stock';
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

describe('useProductosConStock', () => {
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;

  beforeEach(() => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns empty when no products exist', async () => {
    const { result } = renderHook(() => useProductosConStock(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns products with their stock count', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'Harina' }));
    await movements.create({
      productoId: product.id,
      fecha: '2026-05-09' as IsoDate,
      tipo: 'entrada',
      cantidad: 20,
      costoUnitCentavos: 100n,
      motivo: 'Compra',
      businessId: BIZ,
    });

    const { result } = renderHook(() => useProductosConStock(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.producto.nombre).toBe('Harina');
    expect(result.current.data![0]!.stock).toBe(20);
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useProductosConStock(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
