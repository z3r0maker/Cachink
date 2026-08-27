/**
 * useMovimientosRecientes hook tests.
 *
 * Fixture dates are relative to "today" on purpose. The hook queries a
 * rolling 90-day window (`daysAgo(90)` → `today()`), so a hard-coded
 * `fecha` is a time bomb: these tests were written with '2026-05-09'
 * and started failing on 2026-08-07 when that date aged out of the
 * window. Anything asserting "recent" must be dated relative to now.
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
import { useMovimientosRecientes } from '../../src/hooks/use-movimientos-recientes';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

/** A date inside the hook's rolling 90-day window, whenever "now" is. */
function fechaReciente(daysAgo = 1): IsoDate {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10) as IsoDate;
}

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

describe('useMovimientosRecientes', () => {
  let movements: InMemoryInventoryMovementsRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns recent movements', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    await movements.create({
      productoId: product.id,
      fecha: fechaReciente(),
      tipo: 'entrada',
      cantidad: 10,
      costoUnitCentavos: 100n,
      motivo: 'Compra',
      businessId: BIZ,
    });

    const { result } = renderHook(() => useMovimientosRecientes(), {
      wrapper: wrapper({ inventoryMovements: movements }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.tipo).toBe('entrada');
  });

  it('returns empty when no movements exist', async () => {
    const { result } = renderHook(() => useMovimientosRecientes(), {
      wrapper: wrapper({ inventoryMovements: movements }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('respects the limit parameter', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    for (let i = 0; i < 5; i++) {
      await movements.create({
        productoId: product.id,
        fecha: fechaReciente(),
        tipo: 'entrada',
        cantidad: i + 1,
        costoUnitCentavos: 100n,
        motivo: `Compra ${i}`,
        businessId: BIZ,
      });
    }

    const { result } = renderHook(() => useMovimientosRecientes(2), {
      wrapper: wrapper({ inventoryMovements: movements }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});
