/**
 * VentasScreen component tests — tap-to-cart POS surface.
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoDate, IsoTimestamp, ProductId, SaleId } from '@cachink/domain';
import type { Sale } from '@cachink/domain';
import { VentasScreen } from '../../src/screens/index';
import { totalDelDia } from '../../src/hooks/use-total-del-dia';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const PROD_ID = '01JPHK0000000000000000PROD' as ProductId;

function sale(overrides: Partial<Sale>): Sale {
  return {
    id: '01JPHK0000000000000000S001' as SaleId,
    fecha: '2026-04-24' as IsoDate,
    concepto: 'Taco',
    categoria: 'Producto',
    monto: 10000n,
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    productoId: PROD_ID,
    cantidad: 1,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

/** Minimal props for the VentasScreen (tap-to-cart model). */
function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    total: 0n,
    ventaCount: 0,
    productos: [],
    stockMap: undefined,
    productSearch: '',
    onProductSearchChange: vi.fn(),
    // Cart props
    cart: { items: [], totalCentavos: 0n, itemCount: 0 },
    onAddToCart: vi.fn(),
    onRemoveOne: vi.fn(),
    onRemoveAll: vi.fn(),
    onClearCart: vi.fn(),
    cartQuantities: new Map<string, number>(),
    onCheckout: vi.fn(),
    ...overrides,
  };
}

describe('totalDelDia', () => {
  it('returns 0n for an empty list', () => {
    expect(totalDelDia([])).toBe(0n);
  });

  it('sums the monto of every sale as bigint', () => {
    expect(
      totalDelDia([
        sale({ monto: 10000n }),
        sale({ monto: 25000n, id: '01JPHK0000000000000000S002' as SaleId }),
      ]),
    ).toBe(35000n);
  });
});

describe('VentasScreen', () => {
  it('renders the empty-productos state when product list is empty', () => {
    renderWithProviders(
      <VentasScreen {...defaultProps()} />,
    );
    expect(screen.getByTestId('empty-productos')).toBeInTheDocument();
  });

  it('renders the total bar with the formatted total', () => {
    renderWithProviders(
      <VentasScreen {...defaultProps({ total: 35000n, ventaCount: 2 })} />,
    );
    // TotalBar shows the total
    expect(screen.getByTestId('total-bar').textContent).toContain('$350.00');
  });

  it('renders the search bar for product filtering', () => {
    renderWithProviders(
      <VentasScreen {...defaultProps()} />,
    );
    expect(screen.getByTestId('ventas-product-search')).toBeInTheDocument();
  });

  it('renders the empty cart hint when cart is empty', () => {
    renderWithProviders(
      <VentasScreen {...defaultProps()} />,
    );
    expect(screen.getByTestId('empty-cart-hint')).toBeInTheDocument();
  });

  it('renders cart footer when cart has items', () => {
    renderWithProviders(
      <VentasScreen
        {...defaultProps({
          cart: {
            items: [
              { productoId: PROD_ID, nombre: 'Taco', precioUnitCentavos: 2500n, cantidad: 2 },
            ],
            totalCentavos: 5000n,
            itemCount: 2,
          },
          cartQuantities: new Map([[PROD_ID, 2]]),
        })}
      />,
    );
    expect(screen.getByTestId('cart-footer')).toBeInTheDocument();
    expect(screen.getByTestId('cart-footer').textContent).toContain('$50.00');
  });

  it('renders cart strip with items', () => {
    renderWithProviders(
      <VentasScreen
        {...defaultProps({
          cart: {
            items: [
              { productoId: PROD_ID, nombre: 'Taco al Pastor', precioUnitCentavos: 2500n, cantidad: 3 },
            ],
            totalCentavos: 7500n,
            itemCount: 3,
          },
          cartQuantities: new Map([[PROD_ID, 3]]),
        })}
      />,
    );
    expect(screen.getByTestId('cart-strip')).toBeInTheDocument();
    expect(screen.getByText('Taco al Pastor')).toBeInTheDocument();
  });
});
