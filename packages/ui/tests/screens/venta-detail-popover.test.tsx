/**
 * VentaDetailPopover tests (P1C C15 polish).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, DeviceId, IsoDate, IsoTimestamp, Sale, SaleId } from '@cachink/domain';
import { VentaDetailPopover } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const venta: Sale = {
  id: '01JPHK0000000000000000S001' as SaleId,
  fecha: '2026-04-24' as IsoDate,
  concepto: 'Taco',
  categoria: 'Producto',
  monto: 15000n,
  metodo: 'Efectivo',
  clienteId: null,
  estadoPago: 'pagado',
  businessId: '01JPHK00000000000000000008' as BusinessId,
  deviceId: '01JPHK00000000000000000007' as DeviceId,
  createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  deletedAt: null,
};

describe('VentaDetailPopover', () => {
  it('returns null when venta is null even if open=true', () => {
    const { container } = renderWithProviders(
      <VentaDetailPopover
        open
        venta={null}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-testid="venta-detail-popover"]')).toBeNull();
  });

  it('renders share + delete Btns when venta is set and open', () => {
    renderWithProviders(
      <VentaDetailPopover
        open
        venta={venta}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId('venta-detail-share')).toBeInTheDocument();
    expect(screen.getByTestId('venta-detail-delete')).toBeInTheDocument();
  });

  it('fires onShare when Compartir is tapped', () => {
    const onShare = vi.fn();
    renderWithProviders(
      <VentaDetailPopover
        open
        venta={venta}
        onClose={vi.fn()}
        onShare={onShare}
        onDelete={vi.fn()}
      />,
    );
    const btn = screen.getAllByTestId('venta-detail-share')[0]!;
    fireEvent.click(btn);
    expect(onShare).toHaveBeenCalled();
  });

  it('fires onDelete when Eliminar is tapped', () => {
    const onDelete = vi.fn();
    renderWithProviders(
      <VentaDetailPopover
        open
        venta={venta}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onDelete={onDelete}
      />,
    );
    const btn = screen.getAllByTestId('venta-detail-delete')[0]!;
    fireEvent.click(btn);
    expect(onDelete).toHaveBeenCalled();
  });
});
