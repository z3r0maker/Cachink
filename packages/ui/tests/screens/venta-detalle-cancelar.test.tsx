/**
 * Ventas del turno — the sale sheet and the cancel flow (M-08). The ticket in
 * the bottom sheet (lines, tiles, notes, the pill of its estado), the fiado
 * and cancelled variants, and cancelling with a reason: the PIN first, the
 * motivo required, the cash a cash sale hands back, and the sale staying
 * listed as cancelled once it goes through.
 */
import { describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/react';
import { VENTAS_FIXTURE } from '@xangarro/caja/ventas';
import { initI18n } from '../../src/i18n/index';
import { VentasMostradorScreen } from '../../src/screens/Ventas/ventas-mostrador-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

interface Llamadas {
  readonly onCancelar: ReturnType<typeof vi.fn>;
  readonly onCompartir: ReturnType<typeof vi.fn>;
}

function montar(over: Partial<Parameters<typeof VentasMostradorScreen>[0]> = {}): Llamadas {
  const llamas: Llamadas = {
    onCancelar: over.onCancelar ?? vi.fn(async () => null),
    onCompartir: over.onCompartir ?? vi.fn(),
  };
  const { onCancelar: _c, onCompartir: _m, ...rest } = over;
  renderWithProviders(
    <VentasMostradorScreen
      state="happy"
      data={VENTAS_FIXTURE}
      dueno="Pedro"
      onRetry={vi.fn()}
      onIrACobrar={vi.fn()}
      {...rest}
      onCompartir={llamas.onCompartir}
      onCancelar={llamas.onCancelar}
    />,
  );
  return llamas;
}

/** Types into the Input wrapper's native <input> (the harness's drill-down). */
function escribir(testId: string, valor: string): void {
  const campo = screen.getByTestId(testId).querySelector('input');
  expect(campo).toBeTruthy();
  fireEvent.change(campo as Element, { target: { value: valor } });
}

async function abrir(folio: string): Promise<void> {
  fireEvent.click(screen.getByTestId(`venta-fila-${folio}`));
  await waitFor(() => {
    expect(screen.getByTestId('venta-detalle')).toBeInTheDocument();
  });
}

describe('el detalle (efectivo)', () => {
  it('shows the folio, the total, the lines with their prices and the tiles', async () => {
    montar();
    await abrir('V-0412');
    const hoja = within(screen.getByTestId('venta-detalle'));
    expect(hoja.getByText('Venta · V-0412')).toBeInTheDocument();
    expect(hoja.getByText('$160.00')).toBeInTheDocument();
    expect(hoja.getByText('Hoy 14:52 · en efectivo')).toBeInTheDocument();
    expect(hoja.getByText('Taco de pastor')).toBeInTheDocument();
    expect(hoja.getByText('3 × $25.00')).toBeInTheDocument();
    expect(hoja.getByText('Recibiste')).toBeInTheDocument();
    expect(hoja.getByText('Cambio que diste')).toBeInTheDocument();
    expect(hoja.getByText('Enviada')).toBeInTheDocument();
  });

  it('shares the comprobante through the route', async () => {
    const l = montar();
    await abrir('V-0412');
    fireEvent.click(screen.getByTestId('venta-detalle-compartir'));
    expect(l.onCompartir).toHaveBeenCalledTimes(1);
    expect(l.onCompartir.mock.calls[0]?.[0]?.folio).toBe('V-0412');
  });
});

describe('el detalle (fiado)', () => {
  it('says the client, the balance and the way to collect, with no cash tiles', async () => {
    const onAbono = vi.fn();
    montar({ onAbono });
    await abrir('V-0409');
    expect(screen.getByText('Hoy 14:04 · fiado a Doña Mari de la tienda')).toBeInTheDocument();
    expect(screen.getByText('Ahora debe')).toBeInTheDocument();
    expect(screen.getByText('$340.00')).toBeInTheDocument();
    expect(screen.getByTestId('venta-detalle-nota')).toBeInTheDocument();
    expect(screen.getByText(/Esta venta se fue a la cuenta de Doña Mari/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('venta-detalle-abono'));
    expect(onAbono).toHaveBeenCalled();
  });
});

describe('el detalle (cancelada)', () => {
  it('says the estado and the motivo, and only offers Listo', async () => {
    montar();
    await abrir('V-0405');
    expect(screen.getByTestId('venta-detalle-estado')).toHaveTextContent('Cancelada');
    expect(screen.getByText(/Se canceló por: error de captura/)).toBeInTheDocument();
    expect(screen.getByText('Motivo')).toBeInTheDocument();
    expect(screen.getByText('error de captura')).toBeInTheDocument();
    expect(screen.getByTestId('venta-detalle-listo')).toBeInTheDocument();
    expect(screen.queryByTestId('venta-detalle-cancelar')).toBeNull();
    expect(screen.queryByTestId('venta-detalle-compartir')).toBeNull();
  });
});

/** The PIN step is a numpad (like Acceso's): tap the digits, not type them. */
function escribirPin(digitos: string): void {
  for (const d of digitos) fireEvent.click(screen.getByTestId(`numpad-${d}`));
}
describe('cancelar con motivo', () => {
  it('walks PIN → motivo (required) → cash confirm, and the sale stays listed as cancelled', async () => {
    const l = montar();
    await abrir('V-0412');
    fireEvent.click(screen.getByTestId('venta-detalle-cancelar'));
    expect(screen.getByTestId('venta-cancelar')).toBeInTheDocument();

    // Step 1: the PIN that authorizes it.
    escribirPin('1234');
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-resumen')).toBeInTheDocument();
    });

    // A motivo is required: confirming without one goes nowhere.
    fireEvent.click(screen.getByTestId('cancelar-confirmar'));
    expect(l.onCancelar).not.toHaveBeenCalled();
    expect(screen.getByText('Elige un motivo para cancelar.')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancelar-motivo-Error de captura'));

    // The optional note rides along.
    escribir('cancelar-nota', 'se cobró de más');

    // A cash sale confirms the cash it hands back before it goes through.
    fireEvent.click(screen.getByTestId('cancelar-confirmar'));
    await waitFor(() => {
      expect(screen.getByTestId('cancel-cash-confirm')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-cash-confirm'));

    await waitFor(() => {
      expect(l.onCancelar).toHaveBeenCalledWith(
        expect.objectContaining({ folio: 'V-0412' }),
        'Error de captura: se cobró de más',
        '1234',
      );
    });
    await waitFor(() => {
      expect(screen.queryByTestId('venta-cancelar')).toBeNull();
    });
    // The sale stays in the list, cancelled; the sheet says what happened.
    expect(screen.getByTestId('venta-fila-V-0412')).toBeInTheDocument();
    expect(screen.getByText(/Cancelada · Error de captura/)).toBeInTheDocument();
    expect(screen.getByTestId('venta-detalle-aviso')).toBeInTheDocument();
  });

  it('lets a venta captured after the cancellation reach the list', async () => {
    const props = () => ({
      state: 'happy' as const,
      data: VENTAS_FIXTURE,
      dueno: 'Pedro',
      onRetry: vi.fn(),
      onIrACobrar: vi.fn(),
      onCompartir: vi.fn(),
      onCancelar: vi.fn(async () => null as string | null),
    });
    const vista = renderWithProviders(<VentasMostradorScreen {...props()} />);
    await abrir('V-0412');
    fireEvent.click(screen.getByTestId('venta-detalle-cancelar'));
    escribirPin('1234');
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-resumen')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancelar-motivo-Error de captura'));
    fireEvent.click(screen.getByTestId('cancelar-confirmar'));
    await waitFor(() => {
      expect(screen.getByTestId('cancel-cash-confirm')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-cash-confirm'));
    await waitFor(() => {
      expect(screen.queryByTestId('venta-cancelar')).toBeNull();
    });

    // Cobrar just captured another venta; the route re-reads the turno.
    const conNueva: typeof VENTAS_FIXTURE = {
      ...VENTAS_FIXTURE,
      ventas: [
        {
          folio: 'V-0413',
          concepto: '2 quesadilla',
          monto: 65_00n,
          metodo: 'Fiado',
          hora: '15:04',
          cliente: 'Don Pedro',
        },
        ...VENTAS_FIXTURE.ventas,
      ],
    };
    vista.rerender(<VentasMostradorScreen {...props()} data={conNueva} />);

    // The cancellation still shows, and the new venta made it to the list.
    expect(screen.getByText(/Cancelada · Error de captura/)).toBeInTheDocument();
    expect(screen.getByTestId('venta-fila-V-0413')).toBeInTheDocument();
  });

  it('a non-cash sale cancels straight from the motivo step', async () => {
    const l = montar();
    await abrir('V-0409');
    fireEvent.click(screen.getByTestId('venta-detalle-cancelar'));
    escribirPin('0000');
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-resumen')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancelar-motivo-El cliente se arrepintió'));
    fireEvent.click(screen.getByTestId('cancelar-confirmar'));
    await waitFor(() => {
      expect(l.onCancelar).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('cancel-cash-confirm')).toBeNull();
  });

  it('keeps the dialog open with the error when the cancel refuses', async () => {
    const l = montar({ onCancelar: vi.fn(async () => 'PIN incorrecto') });
    await abrir('V-0412');
    fireEvent.click(screen.getByTestId('venta-detalle-cancelar'));
    escribirPin('9999');
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-resumen')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancelar-motivo-Cobro duplicado'));
    fireEvent.click(screen.getByTestId('cancelar-confirmar'));
    fireEvent.click(screen.getByTestId('cancel-cash-confirm'));
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-error')).toBeInTheDocument();
    });
    expect(screen.getByText('PIN incorrecto')).toBeInTheDocument();
    expect(l.onCancelar).toHaveBeenCalledTimes(1);
    // Back at the PIN, refusing again keeps it in the dialog.
    escribirPin('1111');
    fireEvent.click(screen.getByTestId('cancelar-motivo-Cobro duplicado'));
    fireEvent.click(screen.getByTestId('cancelar-confirmar'));
    fireEvent.click(screen.getByTestId('cancel-cash-confirm'));
    await waitFor(() => {
      expect(l.onCancelar).toHaveBeenCalledTimes(2);
    });
  });
});
