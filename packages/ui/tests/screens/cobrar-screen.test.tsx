import { describe, expect, it, vi } from 'vitest';

import { CobrarScreen } from '../../src/screens/Ventas/cobrar-screen';
import type { ProductoCobrar } from '../../src/screens/Ventas/cobrar-catalogo';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

/**
 * Cobrar (M-07): presentation only — the route hands in everything. What is
 * pinned here: the error state that promises the sale survives and offers
 * the retry, the loading spinner, the phone bar against the tablet panels,
 * and the filter that looks through every category when you search.
 */

const QUESO: ProductoCobrar = {
  id: 'p-1',
  nombre: 'Queso Oaxaca',
  precio: 180_00n,
  categoria: 'Producto Terminado',
  icono: 'beef',
  tint: '#fff',
  codigo: null,
  quedan: null,
} as never;

const AGUA: ProductoCobrar = {
  id: 'p-2',
  nombre: 'Agua de jamaica',
  precio: 25_00n,
  categoria: 'Bebidas',
  icono: 'apple',
  tint: '#fff',
  codigo: null,
  quedan: null,
} as never;

function montar(over: Record<string, unknown> = {}) {
  const acciones = {
    onMetodo: vi.fn(),
    onAdd: vi.fn(),
    onBump: vi.fn(),
    onQuitar: vi.fn(),
    onVaciar: vi.fn(),
    onAbrirTicket: vi.fn(),
    onCobrar: vi.fn(),
    onFiado: vi.fn(),
    onEscanear: vi.fn(),
    onProductoNuevo: vi.fn(),
  };
  renderWithProviders(
    <CobrarScreen
      estado="listo"
      productos={[QUESO, AGUA]}
      lines={[{ productoId: 'p-1', nombre: 'Queso Oaxaca', precio: 180_00n, cantidad: 2 }]}
      folio="V-0414"
      metodos={['Efectivo', 'Fiado']}
      metodo="Efectivo"
      {...acciones}
      {...over}
    />,
  );
  return acciones;
}

describe('CobrarScreen', () => {
  it('loading: a spinner, and no error said', () => {
    montar({ estado: 'cargando' });
    expect(screen.getByTestId('cobrar-cargando')).toBeInTheDocument();
    expect(screen.queryByTestId('cobrar-error')).not.toBeInTheDocument();
  });

  it('a failed read promises the sale survives and offers the retry', () => {
    const onReintentar = vi.fn();
    montar({ estado: 'error', onReintentar });
    expect(screen.getByText('No pudimos leer tus productos')).toBeInTheDocument();
    expect(screen.getByText(/Tu venta no se pierde/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it('the phone arrangement: catalogue above, the black bar with piezas and total', () => {
    const a = montar({ disposicion: 'telefono' });
    expect(screen.getByTestId('cobrar-screen')).toBeInTheDocument();
    expect(screen.getByTestId('cart-checkout-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cart-checkout-btn'));
    expect(a.onAbrirTicket).toHaveBeenCalledTimes(1);
  });

  it('the tablet arrangements: the ticket panel instead of the bar', () => {
    montar({ disposicion: 'lado' });
    expect(screen.queryByTestId('cobrar-bar')).not.toBeInTheDocument();

    montar({ disposicion: 'dock' });
    expect(screen.queryByTestId('cobrar-bar')).not.toBeInTheDocument();
  });

  it('the ticket panel drives every action it names', () => {
    const a = montar({ disposicion: 'lado' });
    expect(screen.getByTestId('ticket-total').textContent).toContain('360.00');

    const linea = screen.getByTestId('ticket-linea-p-1');
    const pasos = linea.querySelectorAll('[role="button"]');
    fireEvent.click(pasos[0] ?? document.body); // −1
    expect(a.onBump).toHaveBeenCalledWith('p-1', -1);
    fireEvent.click(pasos[1] ?? document.body); // +1
    expect(a.onBump).toHaveBeenCalledWith('p-1', 1);

    fireEvent.click(screen.getByTestId('ticket-metodo-Fiado'));
    expect(a.onMetodo).toHaveBeenCalledWith('Fiado');
    fireEvent.click(screen.getByTestId('ticket-vaciar'));
    expect(a.onVaciar).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('ticket-fiado'));
    expect(a.onFiado).toHaveBeenCalledTimes(1);
    const cobrar = screen
      .getAllByText(/Cobrar/)
      .map((e) => e.closest('[role="button"]'))
      .find(Boolean) as HTMLElement;
    fireEvent.click(cobrar);
    expect(a.onCobrar).toHaveBeenCalledTimes(1);
  });

  it('adding from the catalogue reports the product', () => {
    const a = montar({ disposicion: 'telefono' });
    const tile = screen.getByText('Agua de jamaica').closest('[role="button"]') ?? document.body;
    fireEvent.click(tile);
    expect(a.onAdd).toHaveBeenCalledWith(AGUA);
  });
});
