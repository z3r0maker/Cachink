/**
 * Ventas del turno — the list and its states (M-08). The figures the board
 * draws, the rows with their chips (a cancelled sale stays, struck through),
 * the method filter, the search, and the loading · sin-ventas · sin-turno ·
 * con-error block. Fed the caja fixture, exactly as the stories are.
 */
import { describe, expect, it, vi } from 'vitest';
import { VENTAS_FIXTURE } from '@xangarro/caja/ventas';
import { initI18n } from '../../src/i18n/index';
import { VentasMostradorScreen } from '../../src/screens/Ventas/ventas-mostrador-screen';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function montar(over: Partial<Parameters<typeof VentasMostradorScreen>[0]> = {}): void {
  const props = {
    state: 'happy' as const,
    data: VENTAS_FIXTURE,
    dueno: 'Pedro',
    onRetry: vi.fn(),
    onIrACobrar: vi.fn(),
    onCompartir: vi.fn(),
    onCancelar: vi.fn(async () => null),
    ...over,
  };
  renderWithProviders(<VentasMostradorScreen {...props} />);
}

describe('la lista', () => {
  it('draws the turno’s three figures, agreeing with the fixture', () => {
    montar();
    expect(screen.getByRole('heading')).toHaveTextContent('Ventas del turno');
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('$3,120.00')).toBeInTheDocument();
    expect(screen.getByText('$1,980.00')).toBeInTheDocument();
    expect(screen.getByText(/Lo que cobraste desde las 08:15/)).toBeInTheDocument();
  });

  it('lists every sale with its folio, chip and amount', () => {
    montar();
    expect(screen.getByTestId('venta-fila-V-0412')).toBeInTheDocument();
    expect(screen.getByText('3 pastor · 1 gringa · 1 horchata')).toBeInTheDocument();
    expect(screen.getByText('$160.00')).toBeInTheDocument();
    expect(screen.getAllByText('Efectivo').length).toBeGreaterThan(0);
  });

  it('keeps the cancelled sale, struck through, next to its Cancelada chip', () => {
    montar();
    expect(screen.getByTestId('venta-fila-V-0405')).toBeInTheDocument();
    expect(screen.getByText(/Cancelada · error de captura/)).toBeInTheDocument();
    expect(screen.getAllByText('Cancelada').length).toBeGreaterThan(0);
  });

  it('says the fiado row’s client', () => {
    montar();
    expect(screen.getByText(/Doña Mari de la tienda/)).toBeInTheDocument();
  });

  it('narrows by method chip', () => {
    montar();
    fireEvent.click(screen.getByTestId('venta-filtro-Fiado'));
    expect(screen.queryByTestId('venta-fila-V-0412')).toBeNull();
    expect(screen.getByTestId('venta-fila-V-0409')).toBeInTheDocument();
    expect(screen.getByTestId('venta-fila-V-0403')).toBeInTheDocument();
  });

  it('searches folio, product and client, and says Sin resultados when nothing matches', () => {
    montar();
    fireEvent.change(screen.getByTestId('venta-buscar'), { target: { value: 'dona mari' } });
    expect(screen.getByTestId('venta-fila-V-0409')).toBeInTheDocument();
    expect(screen.queryByTestId('venta-fila-V-0412')).toBeNull();
    fireEvent.change(screen.getByTestId('venta-buscar'), { target: { value: 'inexistente' } });
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText(/Ninguna venta de tu turno coincide/)).toBeInTheDocument();
  });

  it('carries the amber note about cancelling, with the owner’s name', () => {
    montar();
    expect(screen.getByTestId('venta-nota')).toBeInTheDocument();
    expect(screen.getByText(/Pedro la ve en su portal y en tu corte/)).toBeInTheDocument();
  });
});

describe('los estados', () => {
  it('cargando: the spinner, no list', () => {
    montar({ state: 'loading', data: null });
    expect(screen.getByTestId('ventas-cargando')).toBeInTheDocument();
    expect(screen.queryByTestId('venta-lista')).toBeNull();
  });

  it('sin-ventas: the board’s copy and the way to cobrar', () => {
    const onIrACobrar = vi.fn();
    montar({ state: 'empty', data: null, onIrACobrar });
    expect(screen.getByTestId('ventas-vacio')).toBeInTheDocument();
    expect(screen.getByText('Sin ventas en este turno')).toBeInTheDocument();
    expect(
      screen.getByText(/aparece aquí con su folio, su método y la opción de cancelar/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ventas-ir-cobrar'));
    expect(onIrACobrar).toHaveBeenCalled();
  });

  it('sin-turno: says to open the turno first', () => {
    montar({ state: 'sin-turno', data: null });
    expect(screen.getByTestId('ventas-sin-turno')).toBeInTheDocument();
    expect(screen.getByText('Sin turno abierto')).toBeInTheDocument();
    expect(screen.getByText(/Abre tu turno en Inicio/)).toBeInTheDocument();
  });

  it('con-error: the board’s title and the retry', () => {
    const onRetry = vi.fn();
    montar({ state: 'error', data: null, onRetry });
    expect(screen.getByTestId('ventas-error')).toBeInTheDocument();
    expect(screen.getByText('No pudimos cargar tus ventas')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
