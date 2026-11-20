import { describe, expect, it, vi } from 'vitest';

import { ComprobanteSheet } from '../../src/screens/Checkout/comprobante-sheet';
import type { VentaHecha } from '../../src/screens/Checkout/venta-hecha';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

/**
 * «Mandar comprobante» (MvVentaHecha after a cobro, MvVentas from a past
 * sale): after the cobro the customer's receipt is previewed and the foot
 * starts the next sale; from Ventas the sale was already seen, so the sheet
 * is just the ways to send it and the foot only closes.
 */

const venta = (over: Partial<VentaHecha> = {}): VentaHecha =>
  ({
    ticketId: 't-1',
    folio: 'V-0001',
    hora: '09:41',
    lines: [{ productoId: 'p-1', nombre: 'Alambre', precio: 60_00n, cantidad: 2 }],
    total: 265_00n,
    metodo: 'Efectivo',
    recibido: 500_00n,
    cambio: 235_00n,
    cliente: null,
    saldoCliente: null,
    ...over,
  }) as VentaHecha;

function montar(over: { desdeVentas?: boolean; conNueva?: boolean; v?: VentaHecha } = {}) {
  const onClose = vi.fn();
  const onNueva = vi.fn();
  renderWithProviders(
    <ComprobanteSheet
      open
      venta={over.v ?? venta()}
      business={null}
      onClose={onClose}
      {...(over.conNueva ? { onNueva } : {})}
      {...(over.desdeVentas ? { desdeVentas: true } : {})}
    />,
  );
  return { onClose, onNueva };
}

describe('ComprobanteSheet', () => {
  it('after a cobro: the preview, the change in the eyebrow, and on to the next sale', () => {
    const { onNueva, onClose } = montar({ conNueva: true });
    expect(screen.getByText('Así le llega')).toBeInTheDocument();
    expect(screen.getByText('V-0001 · $265.00 · Cambio $235.00')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('comprobante-nueva'));
    expect(onNueva).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('from Ventas: no preview, «Venta · folio · total», and «Listo» only closes', () => {
    const { onClose } = montar({ desdeVentas: true });
    expect(screen.queryByText('Así le llega')).toBeNull();
    expect(screen.getByText('Venta · V-0001 · $265.00')).toBeInTheDocument();
    expect(screen.getByTestId('comprobante-listo').textContent).toContain('Listo');
    fireEvent.click(screen.getByTestId('comprobante-listo'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('from Ventas, the three ways to send are still there', () => {
    montar({ desdeVentas: true });
    expect(screen.getByTestId('comprobante-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('comprobante-mensajes')).toBeInTheDocument();
    expect(screen.getByTestId('comprobante-menu')).toBeInTheDocument();
  });

  it('a sale with no change leaves the change out of the eyebrow', () => {
    montar({ v: venta({ metodo: 'Tarjeta', recibido: null, cambio: null }), conNueva: true });
    expect(screen.getByText('V-0001 · $265.00')).toBeInTheDocument();
  });

  it('without a next sale wired, the foot closes the sheet', () => {
    const { onClose } = montar();
    fireEvent.click(screen.getByTestId('comprobante-nueva'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
