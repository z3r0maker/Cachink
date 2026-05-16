/**
 * useRegistrarMovimiento hook tests.
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
  makeNewProduct,
} from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useRegistrarMovimiento } from '../../src/hooks/use-registrar-movimiento';
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

describe('useRegistrarMovimiento', () => {
  let movements: InMemoryInventoryMovementsRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('creates an inventory movement via the mutation', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));

    const { result } = renderHook(() => useRegistrarMovimiento(), {
      wrapper: wrapper({ inventoryMovements: movements }),
    });

    await act(async () => {
      result.current.mutate({
        productoId: product.id,
        fecha: '2026-05-09' as IsoDate,
        tipo: 'entrada',
        cantidad: 10,
        costoUnitCentavos: 3500n,
        motivo: 'Compra a proveedor',
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tipo).toBe('entrada');
    expect(result.current.data?.cantidad).toBe(10);
  });

  it('creates a salida movement', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));

    const { result } = renderHook(() => useRegistrarMovimiento(), {
      wrapper: wrapper({ inventoryMovements: movements }),
    });

    await act(async () => {
      result.current.mutate({
        productoId: product.id,
        fecha: '2026-05-09' as IsoDate,
        tipo: 'salida',
        cantidad: 5,
        costoUnitCentavos: 3500n,
        motivo: 'Merma',
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tipo).toBe('salida');
  });
});
