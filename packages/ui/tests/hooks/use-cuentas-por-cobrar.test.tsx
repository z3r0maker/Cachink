/**
 * useCuentasPorCobrar hook tests.
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
import { useCuentasPorCobrar } from '../../src/hooks/use-cuentas-por-cobrar';
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

describe('useCuentasPorCobrar', () => {
  let clients: InMemoryClientsRepository;
  let sales: InMemorySalesRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns empty when no clients have pending sales', async () => {
    const { result } = renderHook(() => useCuentasPorCobrar(), {
      wrapper: wrapper({ clients, sales }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns cuentas with pending Crédito sales', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    const client = await clients.create(
      makeNewClient({ businessId: BIZ, nombre: 'Laura' }),
    );
    await sales.create(
      makeNewSale({
        businessId: BIZ,
        metodo: 'Crédito',
        clienteId: client.id,
        productoId: product.id,
        monto: 5000n,
      }),
    );

    const { result } = renderHook(() => useCuentasPorCobrar(), {
      wrapper: wrapper({ clients, sales }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.cliente.nombre).toBe('Laura');
    expect(result.current.data![0]!.total).toBe(5000n);
  });

  it('is disabled when no businessId is configured', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useCuentasPorCobrar(), {
      wrapper: wrapper({ clients, sales }),
    });
    // Query should not fire
    expect(result.current.fetchStatus).toBe('idle');
  });
});
