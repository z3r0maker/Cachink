import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { CobroScreen } from '../../src/screens/Checkout/cobro-screen';
import type { MetodoCobro } from '../../src/screens/Checkout/cobro-logic';
import { renderWithProviders } from '../test-utils';

/**
 * «Total a cobrar» (MvCobroTotal): the amount owed stays on screen whatever
 * the method, the sale only goes through once the cash covers it, and Fiado
 * goes on to choose the client.
 */

const METODOS: readonly MetodoCobro[] = ['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado'];

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

function montar(total = 160_00n, inicial: MetodoCobro = 'Efectivo') {
  const onCobrar = vi.fn();
  const onFiado = vi.fn();
  renderWithProviders(
    <CobroScreen
      folio="V-0413"
      piezas={5}
      total={total}
      metodos={METODOS}
      metodoInicial={inicial}
      registrando={false}
      error={null}
      onCobrar={onCobrar}
      onFiado={onFiado}
    />,
  );
  return { onCobrar, onFiado };
}

describe('CobroScreen', () => {
  it('leads with the total, and the folio and pieces only reach a screen reader', () => {
    montar();
    expect(screen.getByTestId('cobro-total').textContent).toBe('$160.00');
    expect(screen.getByText('Total a cobrar')).toBeInTheDocument();
    expect(screen.getByLabelText('Total a cobrar, V-0413, 5 piezas')).toBeInTheDocument();
    expect(screen.queryByText(/V-0413/)).toBeNull();
  });

  it('shows a six-figure total whole', () => {
    montar(160_000_00n);
    expect(screen.getByTestId('cobro-total').textContent).toBe('$160,000.00');
  });

  it('keeps the total when the method changes, and swaps the keypad for the panel', () => {
    montar();
    tap(screen.getByTestId('cobro-metodo-Tarjeta'));
    expect(screen.getByTestId('cobro-total').textContent).toBe('$160.00');
    expect(screen.getByTestId('cobro-panel-Tarjeta')).toBeInTheDocument();
    expect(screen.queryByTestId('cobro-tecla-1')).toBeNull();
  });

  it('does not charge while the cash falls short', () => {
    const { onCobrar } = montar();
    tap(screen.getByTestId('cobro-tecla-1'));
    expect(screen.getByTestId('cobro-submit').textContent).toContain('Falta $159.00');
    tap(screen.getByTestId('cobro-submit'));
    expect(onCobrar).not.toHaveBeenCalled();
  });

  it('charges the amount received once it covers the total', () => {
    const { onCobrar } = montar();
    tap(screen.getByTestId('cobro-rapido-1'));
    expect(screen.getByTestId('cobro-submit').textContent).toContain('Cobrar y dar $40.00');
    tap(screen.getByTestId('cobro-submit'));
    expect(onCobrar).toHaveBeenCalledWith({ metodo: 'Efectivo', recibido: 200_00n });
  });

  it('Fiado goes on to choose the client without charging', () => {
    const { onCobrar, onFiado } = montar();
    tap(screen.getByTestId('cobro-fiado'));
    expect(onFiado).toHaveBeenCalledTimes(1);
    expect(onCobrar).not.toHaveBeenCalled();
  });
});
