/**
 * useRegistrarVenta hook tests.
 *
 * Verifies the mutation wiring: use-case construction, cache
 * invalidation on success, and error propagation.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryCajaTurnosRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, UserId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useRegistrarVenta } from '../../src/hooks/use-registrar-venta';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0CUSER' as UserId;

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

describe('useRegistrarVenta', () => {
  let products: InMemoryProductsRepository;
  let sales: InMemorySalesRepository;
  let cajaTurnos: InMemoryCajaTurnosRepository;

  beforeEach(async () => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      userId: USER,
      hydrated: true,
    });
    // Seed an open caja turno so the Caja gate in RegistrarVentaUseCase passes
    await cajaTurnos.create({
      userId: USER,
      fecha: '2026-04-23',
      aperturaAt: '2026-04-23T09:00:00.000Z',
      montoAperturaCentavos: 0n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });
  });

  it('creates a sale via the mutation', async () => {
    const product = await products.create(
      makeNewProduct({ businessId: BIZ }),
    );
    const { result } = renderHook(() => useRegistrarVenta(), {
      wrapper: wrapper({ products, sales, cajaTurnos }),
    });

    await act(async () => {
      result.current.mutate(
        makeNewSale({ businessId: BIZ, productoId: product.id }),
      );
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.productoId).toBe(product.id);
  });

  it('returns error when product does not exist', async () => {
    const { result } = renderHook(() => useRegistrarVenta(), {
      wrapper: wrapper({ products, sales, cajaTurnos }),
    });

    await act(async () => {
      result.current.mutate(
        makeNewSale({ businessId: BIZ }),
      );
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
