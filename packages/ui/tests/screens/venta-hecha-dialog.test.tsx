import { describe, expect, it, vi } from 'vitest';

import { VentaHechaDialog } from '../../src/screens/Checkout/venta-hecha-dialog';
import type { VentaHecha } from '../../src/screens/Checkout/venta-hecha';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

/**
 * «Venta hecha» / «¡Listo! Anotaste…» (MvVentaHecha, MvFiado): cash shows
 * the change big and offers the comprobante; fiado names the account and
 * what they owe now, and never offers to send a receipt it cannot write.
 */

const venta = (over: Partial<VentaHecha> = {}): VentaHecha =>
  ({
    ticketId: 't-1',
    folio: 'V-0413',
    hora: '14:58',
    lines: [],
    total: 350_00n,
    metodo: 'Efectivo',
    recibido: 500_00n,
    cambio: 150_00n,
    cliente: null,
    saldoCliente: null,
    ...over,
  }) as VentaHecha;

function montar(v: VentaHecha | null) {
  const onMandar = vi.fn();
  const onNueva = vi.fn();
  renderWithProviders(
    <VentaHechaDialog venta={v} dueno="Pedro" onMandar={onMandar} onNueva={onNueva} />,
  );
  return { onMandar, onNueva };
}

describe('VentaHechaDialog', () => {
  it('cash: the change to give, big, with what they paid, and both exits', () => {
    montar(venta());
    expect(screen.getByText('Venta hecha')).toBeInTheDocument();
    expect(screen.getByText('Cobraste $350.00')).toBeInTheDocument();
    expect(screen.getByText('Dale de cambio')).toBeInTheDocument();
    expect(screen.getByText(/Pagó con \$500\.00/)).toBeInTheDocument();
    expect(screen.getByTestId('venta-hecha-cifra').textContent).toContain('150.00');

    fireEvent.click(screen.getByTestId('venta-hecha-mandar'));
    fireEvent.click(screen.getByTestId('venta-hecha-nueva'));
  });

  it('fiado: names the account, what they owe now, and offers no comprobante', () => {
    montar(
      venta({
        metodo: 'Fiado',
        recibido: null,
        cambio: null,
        cliente: 'María',
        saldoCliente: 900_00n,
      }),
    );
    expect(screen.getByText('¡Listo! Anotaste $350.00 a María')).toBeInTheDocument();
    expect(screen.getByText(/Se sumó a la cuenta de María/)).toBeInTheDocument();
    expect(screen.getByText('Ahora debe')).toBeInTheDocument();
    expect(screen.getByTestId('venta-hecha-cifra').textContent).toContain('900.00');
    expect(screen.queryByTestId('venta-hecha-mandar')).not.toBeInTheDocument();
  });

  it('no venta: closed, nothing to say', () => {
    montar(null);
    expect(screen.queryByTestId('venta-hecha-cifra')).not.toBeInTheDocument();
  });

  it('the buttons report upward', () => {
    const { onMandar, onNueva } = montar(venta());
    fireEvent.click(screen.getByTestId('venta-hecha-mandar'));
    expect(onMandar).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('venta-hecha-nueva'));
    expect(onNueva).toHaveBeenCalledTimes(1);
  });
});
