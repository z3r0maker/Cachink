/**
 * ProductoDetailRoute smart-wrapper tests (Round 3 F4 coverage).
 *
 * Verifies the wrapper:
 *   - Renders nothing when `row` is null.
 *   - Renders ProductoDetailPopover when given a real row.
 *   - Honours the testID and forwards onClose.
 *
 * Mutation-flow assertions (entrada / salida / eliminar) live in the
 * component-level specs for ProductoDetailPopover, MovimientoModal,
 * and useEliminarProducto. This spec only covers the route wrapper.
 */

import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  BusinessId,
  DeviceId,
  IsoDate,
  NewProduct,
  Product,
  ProductId,
} from '@cachink/domain';
import {
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  MockRepositoryProvider,
} from '@cachink/testing';
import { ProductoDetailRoute } from '../../src/screens/Inventario/producto-detail-route';
import type { ProductoConStock } from '../../src/hooks/use-productos-con-stock';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;
const FECHA = '2026-04-24' as IsoDate;

function makeProducto(): Product {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0PROD01' as ProductId,
    businessId: BIZ,
    deviceId: DEV,
    nombre: 'Aguacate',
    sku: 'AGU-001',
    categoria: 'Producto Terminado',
    costoUnitCentavos: 5000n,
    unidad: 'kg',
    umbralStockBajo: 3,
    createdAt: '2026-04-24T00:00:00Z',
    updatedAt: '2026-04-24T00:00:00Z',
    deletedAt: null,
  } as Product;
}

function makeRow(): ProductoConStock {
  return { producto: makeProducto(), stock: 12 };
}

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

function makeNewProductInput(): NewProduct {
  return {
    businessId: BIZ,
    nombre: 'Aguacate',
    sku: 'AGU-001',
    categoria: 'Producto Terminado',
    costoUnitCentavos: 5000n,
    unidad: 'kg',
    umbralStockBajo: 3,
  };
}

function Wrapper({
  children,
  products = new InMemoryProductsRepository(DEV),
  movements = new InMemoryInventoryMovementsRepository(DEV),
}: {
  children: ReactNode;
  products?: InMemoryProductsRepository;
  movements?: InMemoryInventoryMovementsRepository;
}): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ products, inventoryMovements: movements }}>
        {children}
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('ProductoDetailRoute', () => {
  afterEach(() => useAppConfigStore.getState().reset());

  it('renders null when row is null', () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    const { container } = renderWithProviders(
      <Wrapper>
        <ProductoDetailRoute row={null} fecha={FECHA} onClose={vi.fn()} />
      </Wrapper>,
    );
    // The wrapper returns null when row is null; the test container
    // should be empty of producto-related testIDs.
    expect(container.querySelector('[data-testid*="producto-detail"]')).toBeNull();
  });

  it('renders the producto detail popover when given a valid row', () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    renderWithProviders(
      <Wrapper>
        <ProductoDetailRoute row={makeRow()} fecha={FECHA} onClose={vi.fn()} />
      </Wrapper>,
    );
    // Popover renders the producto's nombre as part of its body.
    expect(screen.getAllByText('Aguacate').length).toBeGreaterThan(0);
  });

  it('continues to render even when no business is selected (graceful pre-hydration)', () => {
    // The MovimientoModal is gated on businessId, but the popover should
    // still render so the user can see the producto detail. This guards
    // the `p.businessId && p.movimiento.state` branch in DetailModals.
    renderWithProviders(
      <Wrapper>
        <ProductoDetailRoute row={makeRow()} fecha={FECHA} onClose={vi.fn()} />
      </Wrapper>,
    );
    // The popover is mounted even without a business.
    expect(screen.getAllByText('Aguacate').length).toBeGreaterThan(0);
  });

  it('opens a confirm dialog when deleting a product with stock and closes it on cancel', async () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    const products = new InMemoryProductsRepository(DEV);
    const producto = await products.create(makeNewProductInput());

    renderWithProviders(
      <Wrapper products={products}>
        <ProductoDetailRoute row={{ producto, stock: 5 }} fecha={FECHA} onClose={vi.fn()} />
      </Wrapper>,
    );

    tap(screen.getAllByTestId('producto-detail-delete')[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('No se puede eliminar')).toBeInTheDocument();
      expect(screen.getByText('Hay unidades en stock. Reduce primero a 0.')).toBeInTheDocument();
    });

    tap(screen.getAllByTestId('confirm-dialog-cancel')[0]!);

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).toBeNull();
      expect(screen.getByTestId('producto-detail-popover')).toBeInTheDocument();
    });
  });

  it('force deletes the product after the confirm dialog approval', async () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    const products = new InMemoryProductsRepository(DEV);
    const producto = await products.create(makeNewProductInput());
    const onClose = vi.fn();

    renderWithProviders(
      <Wrapper products={products}>
        <ProductoDetailRoute row={{ producto, stock: 5 }} fecha={FECHA} onClose={onClose} />
      </Wrapper>,
    );

    tap(screen.getAllByTestId('producto-detail-delete')[0]!);

    await waitFor(() => expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument());

    tap(screen.getAllByTestId('confirm-dialog-confirm')[0]!);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(await products.findById(producto.id)).toBeNull();
  });
});
