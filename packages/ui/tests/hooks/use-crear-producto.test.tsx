/**
 * useCrearProducto hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCrearProducto, type CrearProductoInput } from '../../src/hooks/use-crear-producto';
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

const BASE_INPUT: CrearProductoInput = {
  nombre: 'Harina 1kg',
  categoria: 'Materia Prima',
  costoUnit: 3500n,
  precioVenta: 5000n,
  unidad: 'kg',
};

describe('useCrearProducto', () => {
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;

  beforeEach(() => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('creates a product via the mutation', async () => {
    const { result } = renderHook(() => useCrearProducto(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });

    await act(async () => {
      result.current.mutate(BASE_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Harina 1kg');
  });

  it('creates an initial stock movement when stockInicial is provided', async () => {
    const { result } = renderHook(() => useCrearProducto(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });

    await act(async () => {
      result.current.mutate({ ...BASE_INPUT, stockInicial: 20 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const productId = result.current.data!.id;
    const mvts = await movements.findByProduct(productId);
    expect(mvts).toHaveLength(1);
    expect(mvts[0]!.tipo).toBe('entrada');
    expect(mvts[0]!.cantidad).toBe(20);
  });

  it('does not create a movement when stockInicial is 0', async () => {
    const { result } = renderHook(() => useCrearProducto(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });

    await act(async () => {
      result.current.mutate({ ...BASE_INPUT, stockInicial: 0 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const productId = result.current.data!.id;
    const mvts = await movements.findByProduct(productId);
    expect(mvts).toHaveLength(0);
  });

  it('throws when no business is configured', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useCrearProducto(), {
      wrapper: wrapper({ products, inventoryMovements: movements }),
    });

    await act(async () => {
      result.current.mutate(BASE_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('no current business');
  });
});
