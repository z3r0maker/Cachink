/**
 * ProductoDetailPopover tests (Slice 2 C22).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoTimestamp, Product, ProductId } from '@cachink/domain';
import { ProductoDetailPopover } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const producto: Product = {
  id: '01JPHK0000000000000000R001' as ProductId,
  nombre: 'Tortilla',
  sku: null,
  categoria: 'Producto Terminado',
  costoUnitCentavos: 100n,
  unidad: 'pza',
  umbralStockBajo: 3,
  businessId: '01JPHK00000000000000000008' as BusinessId,
  deviceId: '01JPHK00000000000000000007' as DeviceId,
  createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  deletedAt: null,
};

describe('ProductoDetailPopover', () => {
  it('returns null when producto is null', () => {
    const { container } = renderWithProviders(
      <ProductoDetailPopover
        open
        producto={null}
        stock={0}
        onClose={vi.fn()}
        onEntrada={vi.fn()}
        onSalida={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-testid="producto-detail-popover"]')).toBeNull();
  });

  it('renders entrada / salida / delete Btns', () => {
    renderWithProviders(
      <ProductoDetailPopover
        open
        producto={producto}
        stock={10}
        onClose={vi.fn()}
        onEntrada={vi.fn()}
        onSalida={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId('producto-detail-entrada')).toBeInTheDocument();
    expect(screen.getByTestId('producto-detail-salida')).toBeInTheDocument();
    expect(screen.getByTestId('producto-detail-delete')).toBeInTheDocument();
  });

  it('fires the right callback for each Btn', () => {
    const onEntrada = vi.fn();
    const onSalida = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
      <ProductoDetailPopover
        open
        producto={producto}
        stock={10}
        onClose={vi.fn()}
        onEntrada={onEntrada}
        onSalida={onSalida}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getAllByTestId('producto-detail-entrada')[0]!);
    fireEvent.click(screen.getAllByTestId('producto-detail-salida')[0]!);
    fireEvent.click(screen.getAllByTestId('producto-detail-delete')[0]!);
    expect(onEntrada).toHaveBeenCalled();
    expect(onSalida).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});
