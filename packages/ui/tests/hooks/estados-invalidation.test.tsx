/**
 * Estados-financieros invalidation contract (review item #9).
 *
 * The reported bug: register a venta or a gasto, open Estados, and the
 * numbers were the pre-mutation ones. The query client caches with
 * `staleTime: Infinity`, so nothing refetches unless the mutation
 * explicitly invalidates the estados keys — and it didn't.
 *
 * These tests spy on the real `QueryClient.invalidateQueries` and
 * assert every estados prefix is swept. They fail if someone drops the
 * `estadosKeys.dependentsForBusiness(...)` spread from a mutation's
 * `onSuccess`.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryCajaTurnosRepository,
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
  makeNewProduct,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, IsoDate, UserId } from '@cachink/domain';
import { TamaguiProvider } from '@tamagui/core';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useRegistrarVenta } from '../../src/hooks/use-registrar-venta';
import { useRegistrarEgreso } from '../../src/hooks/use-registrar-egreso';
import { useRegistrarMovimiento } from '../../src/hooks/use-registrar-movimiento';
import { useCerrarCorteDeDia } from '../../src/hooks/use-cerrar-corte-de-dia';
import { useCrearProducto } from '../../src/hooks/use-crear-producto';
import { useEditarProducto } from '../../src/hooks/use-editar-producto';
import { tamaguiConfig } from '../../src/tamagui.config';

/**
 * Dates are relative to "now" on purpose: several of these hooks filter
 * on a rolling window, so a hard-coded fixture date silently ages out.
 */
function currentIsoDate(): IsoDate {
  return new Date().toISOString().slice(0, 10) as IsoDate;
}

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0CUSER' as UserId;

const ESTADOS_PREFIXES = [
  'estado-resultados',
  'balance-general',
  'flujo-efectivo',
  'indicadores',
] as const;

interface Harness {
  readonly wrapper: (props: { children: ReactNode }) => ReactNode;
  readonly invalidated: () => readonly unknown[];
}

function makeHarness(overrides: Record<string, unknown>): Harness {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity }, mutations: { retry: 0 } },
  });
  const spy = vi.spyOn(qc, 'invalidateQueries');

  return {
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <QueryClientProvider client={qc}>
            <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
          </QueryClientProvider>
        </TamaguiProvider>
      );
    },
    invalidated: () =>
      spy.mock.calls
        .map(([filters]) => (filters as { queryKey?: readonly unknown[] } | undefined)?.queryKey)
        .filter((k): k is readonly unknown[] => Array.isArray(k))
        .map((k) => k[0]),
  };
}

describe('estados invalidation after money mutations', () => {
  let products: InMemoryProductsRepository;
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;
  let cajaTurnos: InMemoryCajaTurnosRepository;

  beforeEach(async () => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER, hydrated: true });
    await cajaTurnos.create({
      userId: USER,
      fecha: '2026-04-23',
      aperturaAt: '2026-04-23T09:00:00.000Z',
      montoAperturaCentavos: 0n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });
  });

  it('registrar venta sweeps every estados surface', async () => {
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    const harness = makeHarness({ products, sales, cajaTurnos });

    const { result } = renderHook(() => useRegistrarVenta(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate(makeNewSale({ businessId: BIZ, productoId: producto.id }));
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const swept = harness.invalidated();
    for (const prefix of ESTADOS_PREFIXES) {
      expect(swept).toContain(prefix);
    }
  });

  it('registrar egreso sweeps every estados surface', async () => {
    const harness = makeHarness({ expenses });

    const { result } = renderHook(() => useRegistrarEgreso(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate(makeNewExpense({ businessId: BIZ, concepto: 'Renta' }));
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const swept = harness.invalidated();
    for (const prefix of ESTADOS_PREFIXES) {
      expect(swept).toContain(prefix);
    }
  });

  it('registrar venta still invalidates the ventas list it always did', async () => {
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    const harness = makeHarness({ products, sales, cajaTurnos });

    const { result } = renderHook(() => useRegistrarVenta(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate(makeNewSale({ businessId: BIZ, productoId: producto.id }));
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(harness.invalidated()).toContain('ventas');
  });

  it('registrar movimiento de inventario sweeps every estados surface', async () => {
    // The entrada dual-writes an Expense (ADR-021) — this is the gasto
    // path from Egresos → Inventario that review item #9 reported and
    // that the first sweep missed.
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    const movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    const harness = makeHarness({ products, expenses, inventoryMovements: movements });

    const { result } = renderHook(() => useRegistrarMovimiento(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate({
        productoId: producto.id,
        fecha: currentIsoDate(),
        tipo: 'entrada',
        cantidad: 5,
        costoUnitCentavos: 1500n,
        motivo: 'Compra',
        businessId: BIZ,
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const swept = harness.invalidated();
    for (const prefix of ESTADOS_PREFIXES) {
      expect(swept).toContain(prefix);
    }
  });

  it('cerrar corte de día sweeps every estados surface, not just balance-general', async () => {
    const dayCloses = new InMemoryDayClosesRepository(TEST_DEVICE_ID);
    const harness = makeHarness({ sales, expenses, dayCloses });

    const { result } = renderHook(() => useCerrarCorteDeDia(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate({
        fecha: currentIsoDate(),
        businessId: BIZ,
        deviceId: TEST_DEVICE_ID,
        efectivoContadoCentavos: 0n,
        cerradoPor: 'operativo',
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const swept = harness.invalidated();
    for (const prefix of ESTADOS_PREFIXES) {
      expect(swept).toContain(prefix);
    }
  });

  it('crear producto con stock inicial sweeps every estados surface', async () => {
    const movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    const harness = makeHarness({ products, inventoryMovements: movements });

    const { result } = renderHook(() => useCrearProducto(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate({
        nombre: 'Producto con stock',
        categoria: 'Materia Prima',
        costoUnit: 1000n,
        precioVenta: 2500n,
        unidad: 'kg',
        stockInicial: 10,
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const swept = harness.invalidated();
    for (const prefix of ESTADOS_PREFIXES) {
      expect(swept).toContain(prefix);
    }
  });

  it('editar producto invalidates the real productos key, not the dead English one', async () => {
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    const harness = makeHarness({ products });

    const { result } = renderHook(() => useEditarProducto(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate({ id: producto.id, patch: { nombre: 'Renombrado' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const swept = harness.invalidated();
    // The bug: it used to invalidate ['products', …], which nothing queries.
    expect(swept).toContain('productos');
    expect(swept).not.toContain('products');
    for (const prefix of ESTADOS_PREFIXES) {
      expect(swept).toContain(prefix);
    }
  });

  it('does not invalidate estados when the mutation fails', async () => {
    // No open caja turno for this business → the use-case rejects.
    useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER, hydrated: true });
    const emptyTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    const harness = makeHarness({ products, sales, cajaTurnos: emptyTurnos });

    const { result } = renderHook(() => useRegistrarVenta(), { wrapper: harness.wrapper });
    await act(async () => {
      result.current.mutate(makeNewSale({ businessId: BIZ, productoId: producto.id }));
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(harness.invalidated()).not.toContain('estado-resultados');
  });
});
