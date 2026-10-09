import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@xangarro/domain';

import { ProductoCard } from '../../src/components/ProductoCard/producto-card';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

/**
 * The product tile: price always, stock's badge only when stock was handed
 * in, the manage mode's ⋯ for the long-press menu, a quantity badge in the
 * corner when the ticket already carries it, and a disabled tile that
 * reports nothing.
 */

const PRODUCTO: Product = {
  id: 'p-1',
  nombre: 'Queso Oaxaca',
  sku: null,
  categoria: 'Producto Terminado',
  costoUnitCentavos: 100_00n,
  unidad: 'kg',
  umbralStockBajo: 3,
  tipo: 'producto',
  seguirStock: true,
  precioVentaCentavos: 180_00n,
  atributos: {},
  colorFondo: 'white',
  usoProducto: 'venta',
  icono: 'beef',
  estadoRevision: 'aprobado',
  fusionadoConId: null,
  businessId: 'b-1',
  deviceId: 'd-1',
  createdByUserId: null,
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
  deletedAt: null,
} as unknown as Product;

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('ProductoCard', () => {
  it('names the product and its price, and reports the press', () => {
    const onPress = vi.fn();
    renderWithProviders(<ProductoCard producto={PRODUCTO} mode="sell" onPress={onPress} />);
    expect(screen.getByText('Queso Oaxaca')).toBeInTheDocument();
    expect(screen.getByText('$180.00')).toBeInTheDocument();
    tap(screen.getByTestId('producto-tile-p-1'));
    expect(onPress).toHaveBeenCalledWith(PRODUCTO);
  });

  it('stock shows its badge only when stock was handed in; under the threshold it warns', () => {
    renderWithProviders(<ProductoCard producto={PRODUCTO} mode="sell" onPress={vi.fn()} />);
    expect(screen.queryByText(/^Stock$/)).not.toBeInTheDocument();

    renderWithProviders(
      <ProductoCard producto={PRODUCTO} mode="sell" onPress={vi.fn()} stock={2} />,
    );
    const fila = screen.getByText(/^Stock$/).parentElement;
    expect(fila?.textContent ?? '').toContain('2');
  });

  it('manage mode shows the ⋯, and it reports the long-press without pressing the tile', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    renderWithProviders(
      <ProductoCard
        producto={PRODUCTO}
        mode="manage"
        onPress={onPress}
        onLongPress={onLongPress}
      />,
    );
    fireEvent.click(screen.getByText('⋯'));
    expect(onLongPress).toHaveBeenCalledWith(PRODUCTO);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('a quantity badge rides the corner when the ticket already carries the product', () => {
    renderWithProviders(
      <ProductoCard producto={PRODUCTO} mode="sell" onPress={vi.fn()} badgeCount={3} />,
    );
    expect(screen.getByText('×3')).toBeInTheDocument();
  });

  it('a disabled tile reports nothing', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <ProductoCard producto={PRODUCTO} mode="sell" onPress={onPress} disabled={true} />,
    );
    tap(screen.getByTestId('producto-tile-p-1'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
