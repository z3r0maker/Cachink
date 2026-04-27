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

  // Audit M-1 PR 4 (audit 4.6) — `<FAB>` is mounted when `showFab` is
  // true and fires the same `onNuevaVenta` handler as the
  // `<SectionTitle>` Btn. Mobile shells pass `showFab`; desktop shells
  // leave it unset and continue to use the top-right Btn only.
  it('mounts a FAB when showFab is true and routes its tap to onNuevaVenta', () => {
    const onNuevaVenta = vi.fn();
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[]}
        total={0n}
        onNuevaVenta={onNuevaVenta}
        showFab
      />,
    );
    const fab = screen.getAllByTestId('ventas-fab')[0]!;
    expect(fab).toBeInTheDocument();
    fireEvent.pointerDown(fab);
    fireEvent.pointerUp(fab);
    fireEvent.click(fab);
    expect(onNuevaVenta).toHaveBeenCalledTimes(1);
  });

  it('does not mount the FAB when showFab is unset (desktop default)', () => {
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[]}
        total={0n}
        onNuevaVenta={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('ventas-fab')).toBeNull();
  });

  // Audit Round 2 K1: per-row swipe-to-edit + swipe-to-delete wiring.
  it('wraps each row in a `<SwipeableRow>` when onEditVenta or onEliminarVenta are supplied', () => {
    const ventaA = sale({ id: '01JPHK0000000000000000VA01' as SaleId });
    const ventaB = sale({ id: '01JPHK0000000000000000VB02' as SaleId });
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[ventaA, ventaB]}
        total={20000n}
        onNuevaVenta={vi.fn()}
        onEditVenta={vi.fn()}
        onEliminarVenta={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId(`venta-swipe-${ventaA.id}`).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId(`venta-swipe-${ventaB.id}`).length).toBeGreaterThan(0);
  });

  it('does NOT wrap rows when the swipe handlers are unset (legacy mounts unchanged)', () => {
    const v = sale({ id: '01JPHK0000000000000000VC03' as SaleId });
    renderWithProviders(
      <VentasScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        ventas={[v]}
        total={10000n}
        onNuevaVenta={vi.fn()}
      />,
    );
    expect(screen.queryByTestId(`venta-swipe-${v.id}`)).toBeNull();
  });
});
