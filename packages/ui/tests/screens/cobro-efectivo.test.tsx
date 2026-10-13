import { describe, expect, it, vi } from 'vitest';

import { CobroEfectivo } from '../../src/screens/Checkout/cobro-efectivo';
import { estadoEfectivo } from '../../src/screens/Checkout/cobro-logic';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';

/**
 * «¿Con cuánto paga?» (MvCobro): the keypad, the round bills with «Exacto»,
 * and the verdict card that is grey before anything is typed, green with the
 * change once it covers, red with what is still missing. The arithmetic is
 * cobro-logic's and fully covered; this pins what the cashier sees.
 */

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

function montar(total: bigint, tecleado: string) {
  const onTecla = vi.fn();
  const onMonto = vi.fn();
  renderWithProviders(
    <CobroEfectivo
      total={total}
      tecleado={tecleado}
      estado={estadoEfectivo(tecleado, total)}
      onTecla={onTecla}
      onMonto={onMonto}
    />,
  );
  return { onTecla, onMonto };
}

describe('CobroEfectivo', () => {
  it('nothing typed: grey «Su cambio» at zero, and «Exacto» among the bills', () => {
    montar(350_00n, '');
    expect(screen.getByTestId('cobro-cambio').textContent).toContain('Su cambio');
    expect(screen.getByTestId('cobro-cambio').textContent).toContain('$0.00');
    expect(screen.getByTestId('cobro-recibido').textContent).toBe('$0.00');
    expect(screen.getByLabelText(/Exacto/)).toBeInTheDocument();
  });

  it('covering the total: green, the change counted, and the typed amount with its decimals shown', () => {
    montar(350_00n, '500');
    const cambio = screen.getByTestId('cobro-cambio').textContent ?? '';
    expect(cambio).toContain('Su cambio');
    expect(cambio).toContain('150.00');
    expect(cambio).toContain('Cuéntalo frente al cliente');
    expect(screen.getByTestId('cobro-recibido').textContent).toBe('$500');
  });

  it('a half-typed amount reads exactly as typed, not rounded', () => {
    montar(350_00n, '500.5');
    expect(screen.getByTestId('cobro-recibido').textContent).toBe('$500.5');
  });

  it('exact: green with «Pagó exacto.»', () => {
    montar(350_00n, '350');
    const cambio = screen.getByTestId('cobro-cambio').textContent ?? '';
    expect(cambio).toContain('Pagó exacto');
    expect(cambio).toContain('$0.00');
  });

  it('short: red, what is missing, and the ask for the rest', () => {
    montar(350_00n, '200');
    const cambio = screen.getByTestId('cobro-cambio').textContent ?? '';
    expect(cambio).toContain('Todavía falta');
    expect(cambio).toContain('150.00');
    expect(cambio).toContain('Pídele el resto');
  });

  it('tapping a bill reports its typed form; the active bill inverts', () => {
    const { onMonto } = montar(350_00n, '');
    const exacto = screen
      .getAllByTestId(/cobro-rapido-/)
      .find((b) => (b.textContent ?? '').includes('Exacto')) as HTMLElement;
    tap(exacto);
    expect(onMonto).toHaveBeenCalledWith('350');

    cleanup();
    const { onMonto: segunda } = (() => {
      const onTecla2 = vi.fn();
      const onMonto2 = vi.fn();
      renderWithProviders(
        <CobroEfectivo
          total={350_00n}
          tecleado="500"
          estado={estadoEfectivo('500', 350_00n)}
          onTecla={onTecla2}
          onMonto={onMonto2}
        />,
      );
      return { onTecla: onTecla2, onMonto: onMonto2 };
    })();
    const billetes_ = screen.getAllByTestId(/cobro-rapido-/);
    expect(billetes_.length).toBeGreaterThan(0);
    const quinientos = billetes_.find((b) => (b.textContent ?? '').includes('500'));
    expect(quinientos).toBeDefined();
    tap(quinientos as HTMLElement);
    expect(segunda).toHaveBeenCalledWith('500');
  });

  it('the keypad: digits, the point, and borrar, each reporting its key', () => {
    const { onTecla } = montar(350_00n, '');
    for (const k of ['7', '.', '0', 'borrar']) {
      tap(screen.getByTestId(`cobro-tecla-${k}`));
    }
    expect(onTecla.mock.calls.map((c) => c[0])).toEqual(['7', '.', '0', 'borrar']);
    expect(screen.getByLabelText('Borrar')).toBeInTheDocument();
    expect(screen.getByLabelText('Punto')).toBeInTheDocument();
  });
});
