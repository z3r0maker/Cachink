/**
 * StockBajoBanner tests (Slice 2 C20).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoTimestamp, Product, ProductId } from '@cachink/domain';
import { StockBajoBanner, countBajoStock } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';
import type { ProductoConStock } from '../../src/hooks/use-productos-con-stock';

initI18n();

function producto(overrides: Partial<Product> = {}): Product {
  return {
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
    ...overrides,
  };
}

function row(p: Product, stock: number): ProductoConStock {
  return { producto: p, stock };
}

describe('countBajoStock', () => {
  it('counts productos with stock <= umbralStockBajo', () => {
    const items = [
      row(producto({ umbralStockBajo: 3 }), 1),
      row(producto({ id: '01JPHK0000000000000000R002' as ProductId, umbralStockBajo: 3 }), 3),
      row(producto({ id: '01JPHK0000000000000000R003' as ProductId, umbralStockBajo: 3 }), 5),
    ];
    expect(countBajoStock(items)).toBe(2);
  });

  it('returns 0 when no productos are low', () => {
    expect(countBajoStock([row(producto({ umbralStockBajo: 3 }), 10)])).toBe(0);
  });
});

describe('StockBajoBanner', () => {
  it('returns null when count is zero', () => {
    const { container } = renderWithProviders(
      <StockBajoBanner items={[row(producto({ umbralStockBajo: 3 }), 10)]} />,
    );
    expect(container.querySelector('[data-testid="stock-bajo-banner"]')).toBeNull();
  });

  it('renders with count when at least one producto is low', () => {
    renderWithProviders(<StockBajoBanner items={[row(producto({ umbralStockBajo: 3 }), 1)]} />);
    expect(screen.getByTestId('stock-bajo-banner').textContent).toContain('1');
  });

  it('fires onVer when Ver Btn is tapped', () => {
    const onVer = vi.fn();
    renderWithProviders(
      <StockBajoBanner items={[row(producto({ umbralStockBajo: 3 }), 1)]} onVer={onVer} />,
    );
    const btn = screen.getAllByTestId('stock-bajo-ver')[0]!;
    fireEvent.click(btn);
    expect(onVer).toHaveBeenCalled();
  });
});
