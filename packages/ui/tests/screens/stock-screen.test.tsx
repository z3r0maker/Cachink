/**
 * StockScreen tests (Slice 2 C11, M5-T01).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoTimestamp, Product, ProductId } from '@cachink/domain';
import { StockScreen, filterProductos } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';
import type { ProductoConStock } from '../../src/hooks/use-productos-con-stock';

initI18n();

function producto(overrides: Partial<Product> = {}): Product {
  return {
    id: '01JPHK0000000000000000R001' as ProductId,
    nombre: 'Tortilla',
    sku: 'TOR-001',
    categoria: 'Producto Terminado',
    costoUnitCentavos: 100n,
    unidad: 'pza',
    umbralStockBajo: 3,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

function row(prod: Product, stock: number): ProductoConStock {
  return { producto: prod, stock };
}

describe('filterProductos', () => {
  const items = [
    row(
      producto({
        id: '01JPHK0000000000000000R001' as ProductId,
        nombre: 'Tortilla',
        sku: 'TOR-001',
      }),
      10,
    ),
    row(
      producto({
        id: '01JPHK0000000000000000R002' as ProductId,
        nombre: 'Salsa verde',
        sku: 'SAL-002',
      }),
      5,
    ),
  ];

  it('returns all rows for an empty query', () => {
    expect(filterProductos(items, '')).toHaveLength(2);
  });

  it('matches by nombre (case-insensitive)', () => {
    expect(filterProductos(items, 'tort')).toHaveLength(1);
    expect(filterProductos(items, 'SALSA')).toHaveLength(1);
  });

  it('matches by SKU', () => {
    expect(filterProductos(items, 'SAL-002')).toHaveLength(1);
  });
});

describe('StockScreen', () => {
  it('renders the empty state when items is empty', () => {
    renderWithProviders(
      <StockScreen query="" onChangeQuery={vi.fn()} items={[]} onNuevoProducto={vi.fn()} />,
    );
    expect(screen.getByTestId('empty-productos')).toBeInTheDocument();
  });

  it('renders one ProductoCard per row', () => {
    const items = [row(producto({ nombre: 'Tortilla' }), 10)];
    renderWithProviders(
      <StockScreen query="" onChangeQuery={vi.fn()} items={items} onNuevoProducto={vi.fn()} />,
    );
    expect(screen.getByText('Tortilla')).toBeInTheDocument();
  });

  it('fires onNuevoProducto when the header Btn is tapped', () => {
    const onNuevoProducto = vi.fn();
    renderWithProviders(
      <StockScreen query="" onChangeQuery={vi.fn()} items={[]} onNuevoProducto={onNuevoProducto} />,
    );
    const btn = screen.getAllByTestId('stock-nuevo-producto')[0]!;
    fireEvent.click(btn);
    expect(onNuevoProducto).toHaveBeenCalled();
  });

  // Audit Round 2 K3: per-row swipe wiring.
  it('wraps each row in `<SwipeableRow>` when swipe handlers are supplied', () => {
    const items = [row(producto({ id: '01JPHK0000000000000000R099' as ProductId }), 5)];
    renderWithProviders(
      <StockScreen
        query=""
        onChangeQuery={vi.fn()}
        items={items}
        onNuevoProducto={vi.fn()}
        onEditProducto={vi.fn()}
        onEliminarProducto={vi.fn()}
      />,
    );
    expect(
      screen.getAllByTestId('producto-swipe-01JPHK0000000000000000R099').length,
    ).toBeGreaterThan(0);
  });

  it('does NOT wrap rows when swipe handlers are unset', () => {
    const items = [row(producto({ id: '01JPHK0000000000000000R098' as ProductId }), 5)];
    renderWithProviders(
      <StockScreen query="" onChangeQuery={vi.fn()} items={items} onNuevoProducto={vi.fn()} />,
    );
    expect(screen.queryByTestId('producto-swipe-01JPHK0000000000000000R098')).toBeNull();
  });
});
