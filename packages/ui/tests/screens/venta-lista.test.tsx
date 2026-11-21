/**
 * Ventas del turno — the list and its states (M-08). The figures the board
 * draws, the rows with their chips (a cancelled sale stays, marked),
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
    onRetry: vi.fn(),
    onIrACobrar: vi.fn(),
    onAbrirTurno: vi.fn(),
    onCompartir: vi.fn(),
    onCancelar: vi.fn(async () => null),
    ...over,
  };
  renderWithProviders(<VentasMostradorScreen {...props} />);
}

describe('la lista', () => {
  it('draws the title line and the three compact figures, agreeing with the fixture', () => {
    montar();
    expect(screen.getByRole('heading')).toHaveTextContent('Ventas');
    expect(screen.getByText('12 en tu turno, desde las 08:15')).toBeInTheDocument();
    const cifras = screen.getByTestId('venta-resumen');
    expect(cifras).toHaveTextContent('Cobrado$3,120.00');
    expect(cifras).toHaveTextContent('En efectivo$1,980.00');
    expect(cifras).toHaveTextContent('Canceladas1');
  });

  it('lists every sale with its folio, chip and amount', () => {
    montar();
    expect(screen.getByTestId('venta-fila-V-0412')).toBeInTheDocument();
    expect(screen.getByText('3 pastor · 1 gringa · 1 horchata')).toBeInTheDocument();
    expect(screen.getByText('$160.00')).toBeInTheDocument();
    expect(screen.getAllByText('Efectivo').length).toBeGreaterThan(0);
  });

  it('keeps the cancelled sale, next to its Cancelada chip, and says so to VoiceOver', () => {
    montar();
    const fila = screen.getByTestId('venta-fila-V-0405');
    expect(fila).toHaveTextContent('Cancelada');
    expect(fila).toHaveAttribute('aria-label', 'Ver venta V-0405, $60.00, Efectivo, cancelada');
  });

  it('says the client only on a fiado row', () => {
    montar();
    expect(screen.getByTestId('venta-fila-V-0409')).toHaveTextContent('Doña Mari de la tienda');
    expect(screen.getByTestId('venta-fila-V-0412')).toHaveAttribute(
      'aria-label',
      'Ver venta V-0412, $160.00, Efectivo',
    );
    expect(screen.queryByText(/Ana Robledo · Caja 1/)).toBeNull();
  });

  it('narrows by method chip', () => {
    montar();
    fireEvent.click(screen.getByTestId('venta-filtro-Fiado'));
    expect(screen.queryByTestId('venta-fila-V-0412')).toBeNull();
    expect(screen.getByTestId('venta-fila-V-0409')).toBeInTheDocument();
    expect(screen.getByTestId('venta-fila-V-0403')).toBeInTheDocument();
  });

  it('searches folio, product and client, and says so when nothing matches', () => {
    montar();
    fireEvent.change(screen.getByTestId('venta-buscar'), { target: { value: 'dona mari' } });
    expect(screen.getByTestId('venta-fila-V-0409')).toBeInTheDocument();
    expect(screen.queryByTestId('venta-fila-V-0412')).toBeNull();
    fireEvent.change(screen.getByTestId('venta-buscar'), { target: { value: 'inexistente' } });
    expect(screen.getByText('No hay ventas con ese filtro')).toBeInTheDocument();
    expect(screen.getByText(/Prueba con otra forma de pago/)).toBeInTheDocument();
  });

  it('carries no standing note under the list (the cancel dialog says it)', () => {
    montar();
    expect(screen.queryByTestId('venta-nota')).toBeNull();
    expect(screen.queryByText(/Puedes cancelar ventas/)).toBeNull();
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
    expect(screen.getByText('Todavía no hay ventas en este turno')).toBeInTheDocument();
    expect(screen.getByText('En cuanto cobres algo, aparece en esta lista.')).toBeInTheDocument();
    expect(screen.getByTestId('ventas-vacio-cta')).toHaveTextContent('Cobrar la primera');
    fireEvent.click(screen.getByTestId('ventas-vacio-cta'));
    expect(onIrACobrar).toHaveBeenCalled();
  });

  it('sin-turno: opens the turno right here, not by way of Cobrar', () => {
    const onAbrirTurno = vi.fn();
    const onIrACobrar = vi.fn();
    montar({ state: 'sin-turno', data: null, onAbrirTurno, onIrACobrar });
    expect(screen.getByTestId('ventas-sin-turno')).toBeInTheDocument();
    expect(screen.getByText('Sin turno abierto')).toBeInTheDocument();
    expect(screen.getByText(/Abre tu turno y lo que cobres se va sumando/)).toBeInTheDocument();
    expect(screen.getByTestId('ventas-sin-turno-cta')).toHaveTextContent('Abrir turno');
    fireEvent.click(screen.getByTestId('ventas-sin-turno-cta'));
    expect(onAbrirTurno).toHaveBeenCalledTimes(1);
    expect(onIrACobrar).not.toHaveBeenCalled();
  });

  it('con-error: the board’s title and the retry', () => {
    const onRetry = vi.fn();
    montar({ state: 'error', data: null, onRetry });
    expect(screen.getByTestId('ventas-error')).toBeInTheDocument();
    expect(screen.getByText('No pudimos cargar tus ventas')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ventas-error-reintentar'));
    expect(onRetry).toHaveBeenCalled();
  });
});
