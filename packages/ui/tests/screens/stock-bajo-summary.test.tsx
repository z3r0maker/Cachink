/**
 * StockBajoSummary tests (Slice 2 C21).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoTimestamp, Product, ProductId } from '@cachink/domain';
import { StockBajoSummary } from '../../src/screens/index';
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

describe('StockBajoSummary', () => {
  it('returns null when no productos are low', () => {
    const { container } = renderWithProviders(
      <StockBajoSummary items={[row(producto({ umbralStockBajo: 3 }), 10)]} />,
    );
    expect(container.querySelector('[data-testid="stock-bajo-summary"]')).toBeNull();
  });

  it('renders the count when at least one producto is low', () => {
    renderWithProviders(<StockBajoSummary items={[row(producto({ umbralStockBajo: 3 }), 1)]} />);
    expect(screen.getByTestId('stock-bajo-summary').textContent).toContain('1');
  });

  it('fires onVer when the Ver Btn is tapped', () => {
    const onVer = vi.fn();
    renderWithProviders(
      <StockBajoSummary items={[row(producto({ umbralStockBajo: 3 }), 1)]} onVer={onVer} />,
    );
    const btn = screen.getAllByTestId('stock-bajo-summary-ver')[0]!;
    fireEvent.click(btn);
    expect(onVer).toHaveBeenCalled();
  });
});
