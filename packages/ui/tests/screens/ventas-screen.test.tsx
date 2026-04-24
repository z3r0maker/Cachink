/**
 * VentasScreen component tests (P1C-M3-T01).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoDate, IsoTimestamp, SaleId } from '@cachink/domain';
import type { Sale } from '@cachink/domain';
import { VentasScreen } from '../../src/screens/index';
import { totalDelDia } from '../../src/hooks/use-total-del-dia';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

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
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
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
  it('renders the empty state when the list is empty', () => {
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[]}
        total={0n}
        onNuevaVenta={vi.fn()}
      />,
    );
    expect(screen.getByTestId('empty-ventas')).toBeInTheDocument();
  });

  it('renders one VentaCard per sale and the formatted total', () => {
    const ventas = [
      sale({ id: '01JPHK0000000000000000S001' as SaleId, concepto: 'Taco', monto: 10000n }),
      sale({ id: '01JPHK0000000000000000S002' as SaleId, concepto: 'Refresco', monto: 25000n }),
    ];
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={ventas}
        total={35000n}
        onNuevaVenta={vi.fn()}
      />,
    );
    expect(screen.getByText('Taco')).toBeInTheDocument();
    expect(screen.getByText('Refresco')).toBeInTheDocument();
    expect(screen.getByTestId('ventas-total-card').textContent).toContain('$350.00');
  });

  it('invokes onNuevaVenta when the header Btn is tapped', () => {
    const onNuevaVenta = vi.fn();
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[sale({})]}
        total={10000n}
        onNuevaVenta={onNuevaVenta}
      />,
    );
    const btn = screen.getAllByTestId('ventas-nueva')[0]!;
    fireEvent.click(btn);
    expect(onNuevaVenta).toHaveBeenCalled();
  });

  it('renders a skeleton when loading', () => {
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[]}
        total={0n}
        onNuevaVenta={vi.fn()}
        loading
      />,
    );
    expect(screen.getByTestId('ventas-skeleton-0')).toBeInTheDocument();
  });

  it('renders an error banner with retry when error prop is set', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[]}
        total={0n}
        onNuevaVenta={vi.fn()}
        error={new Error('boom')}
        onRetry={onRetry}
      />,
    );
    const retryBtn = screen.getAllByTestId('ventas-retry')[0]!;
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });
});
