/**
 * VentasScreen component tests — inline POS surface (ADR-048).
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

/** Minimal props for the new VentasScreen. */
function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    fecha: '2026-04-24',
    onChangeFecha: vi.fn(),
    ventas: [] as readonly Sale[],
    total: 0n,
    productos: [],
    stockMap: undefined,
    onProductoTap: vi.fn(),
    productSearch: '',
    onProductSearchChange: vi.fn(),
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

  it('renders VentaCards and the formatted total when ventas exist', () => {
    const ventas = [
      sale({ id: '01JPHK0000000000000000S001' as SaleId, concepto: 'Taco', monto: 10000n }),
      sale({ id: '01JPHK0000000000000000S002' as SaleId, concepto: 'Refresco', monto: 25000n }),
    ];
    renderWithProviders(
      <VentasScreen {...defaultProps({ ventas, total: 35000n })} />,
    );
    expect(screen.getByText('Taco')).toBeInTheDocument();
    expect(screen.getByText('Refresco')).toBeInTheDocument();
    expect(screen.getByTestId('ventas-total-card').textContent).toContain('$350.00');
  });

  it('renders a skeleton when loading', () => {
    renderWithProviders(
      <VentasScreen {...defaultProps({ loading: true })} />,
    );
    expect(screen.getByTestId('ventas-skeleton-0')).toBeInTheDocument();
  });

  it('renders an error banner with retry when error prop is set', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <VentasScreen
        {...defaultProps({ error: new Error('boom'), onRetry })}
      />,
    );
    expect(screen.getByTestId('ventas-error')).toBeInTheDocument();
  });

  it('renders the search bar for product filtering', () => {
    renderWithProviders(
      <VentasScreen {...defaultProps()} />,
    );
    expect(screen.getByTestId('ventas-product-search')).toBeInTheDocument();
  });

  it('wraps each sale row in a SwipeableRow when handlers are supplied', () => {
    const ventaA = sale({ id: '01JPHK0000000000000000VA01' as SaleId });
    const ventaB = sale({ id: '01JPHK0000000000000000VB02' as SaleId });
    renderWithProviders(
      <VentasScreen
        {...defaultProps({
          ventas: [ventaA, ventaB],
          total: 20000n,
          onEditVenta: vi.fn(),
          onEliminarVenta: vi.fn(),
        })}
      />,
    );
    expect(screen.getAllByTestId(`venta-swipe-${ventaA.id}`).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId(`venta-swipe-${ventaB.id}`).length).toBeGreaterThan(0);
  });
});
