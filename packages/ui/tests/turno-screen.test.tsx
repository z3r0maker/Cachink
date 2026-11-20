/**
 * Mi turno (Track M, M-09, board MvTurno): the head, the hero with the
 * expected cash and its parts folded under «Ver de dónde sale», the two
 * figures, the rows and the fixed foot; sin-turno says its way forward; and
 * with records still to send the band warns while «Cerrar turno» stays
 * (ADR-123).
 */
import { describe, expect, it, vi } from 'vitest';
import { TURNO_FIXTURE } from '@xangarro/caja/turno';
import { initI18n } from '../src/i18n/index';
import { MiTurnoScreen } from '../src/screens/Turno/mi-turno-screen';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

const COLA = {
  porEnviar: 0,
  reintentando: 0,
  sinRed: false,
  enviando: false,
  onReintentar: () => undefined,
};

const ACCIONES = {
  onCerrar: vi.fn(),
  onBloquear: vi.fn(),
  onRetry: vi.fn(),
  onIrAInicio: vi.fn(),
  onAbrirTurno: vi.fn(),
};

const FILAS = <div data-testid="turno-filas-de-prueba" />;

function montar(over: Record<string, unknown> = {}) {
  renderWithProviders(
    <MiTurnoScreen
      state="happy"
      data={TURNO_FIXTURE}
      cola={COLA}
      filas={FILAS}
      {...ACCIONES}
      {...over}
    />,
  );
  return ACCIONES;
}

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

describe('MiTurnoScreen · turno', () => {
  it('heads with the operator, the opening time and the day', () => {
    montar();
    expect(screen.getByText('Mi turno')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(
      screen.getByText('Ana Robledo, desde las 08:15 · jueves 14 de mayo'),
    ).toBeInTheDocument();
  });

  it('says the expected cash once, its parts folded until asked for', () => {
    montar();
    expect(screen.getAllByText('$2,710.00')).toHaveLength(1);
    expect(screen.getByText('Es lo que debes contar cuando cierres tu turno.')).toBeInTheDocument();
    expect(screen.queryByTestId('turno-desglose')).toBeNull();
    expect(screen.getByTestId('turno-ver-desglose').getAttribute('aria-expanded')).toBe('false');
    tap('turno-ver-desglose');
    expect(screen.getByTestId('turno-ver-desglose').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Ocultar de dónde sale')).toBeInTheDocument();
    expect(screen.getByText('Fondo de caja')).toBeInTheDocument();
    expect(screen.getByText('con el que abriste')).toBeInTheDocument();
    expect(screen.getByText('+$1,980.00')).toBeInTheDocument();
    expect(screen.getByText('+$550.00')).toBeInTheDocument();
    expect(screen.getByText('−$620.00')).toBeInTheDocument();
    expect(screen.getByText('Debe haber')).toBeInTheDocument();
    expect(screen.getAllByText('$2,710.00')).toHaveLength(2);
    tap('turno-ver-desglose');
    expect(screen.queryByTestId('turno-desglose')).toBeNull();
  });

  it('says two figures only, Ventas and Cobrado, with their hints', () => {
    montar();
    expect(screen.getByText('$3,120.00')).toBeInTheDocument();
    expect(screen.getByText('Una cancelada a las 12:58')).toBeInTheDocument();
    expect(screen.getByText('Todos los métodos')).toBeInTheDocument();
    expect(screen.queryByText('Dos clientes')).toBeNull();
    expect(screen.queryByTestId('turno-movimientos')).toBeNull();
  });

  it('the rows the route hands it, and the foot: lock and «Cerrar turno»', () => {
    const a = montar();
    expect(screen.getByTestId('turno-filas-de-prueba')).toBeInTheDocument();
    expect(screen.getByText('Cerrar turno')).toBeInTheDocument();
    tap('turno-cerrar-mi-turno');
    expect(a.onCerrar).toHaveBeenCalled();
    tap('turno-bloquear');
    expect(a.onBloquear).toHaveBeenCalled();
  });

  it('an open turno with nothing captured still says its figures', () => {
    montar({ data: { ...TURNO_FIXTURE, movimientos: [] }, state: 'empty' });
    expect(screen.getAllByText('$2,710.00').length).toBeGreaterThan(0);
    expect(screen.getByTestId('turno-cerrar-mi-turno')).toBeInTheDocument();
  });
});

describe('MiTurnoScreen · con-registros-por-enviar', () => {
  it('the band warns, and closing stays: the queue never blocks (ADR-123)', () => {
    const a = montar({ cola: { ...COLA, porEnviar: 3, reintentando: 1 } });
    expect(screen.getByTestId('cierre-por-enviar').textContent).toContain(
      'Tienes 3 registros por enviar (1 se reintentará solo).',
    );
    expect(screen.getByTestId('cierre-por-enviar').textContent).toContain(
      'Puedes cerrar; se enviarán cuando vuelva la conexión.',
    );
    expect(screen.getByTestId('turno-cerrar-mi-turno')).toBeInTheDocument();
    tap('turno-cerrar-mi-turno');
    expect(a.onCerrar).toHaveBeenCalled();
  });

  it('«Reintentar envío» goes to the route, and «Ver cuáles» only when wired', () => {
    const reintentar = vi.fn();
    montar({ cola: { ...COLA, porEnviar: 2, onReintentar: reintentar } });
    tap('cierre-reintentar-envio');
    expect(reintentar).toHaveBeenCalled();
    expect(screen.queryByTestId('cierre-ver-cuales')).toBeNull();
  });
});

describe('MiTurnoScreen · sin-turno y errores', () => {
  it('sin-turno opens the turno right here, not by way of Inicio', () => {
    const a = montar({ state: 'sin-turno', data: null });
    expect(screen.getByTestId('turno-filas-de-prueba')).toBeInTheDocument();
    expect(screen.getByTestId('turno-bloquear')).toBeInTheDocument();
    expect(screen.queryByTestId('turno-cerrar-mi-turno')).toBeNull();
    expect(screen.getByTestId('turno-sin-turno').textContent).toContain('Sin turno abierto');
    expect(screen.queryByText('Ir a Inicio')).toBeNull();
    tap('turno-sin-turno-cta');
    expect(a.onAbrirTurno).toHaveBeenCalledTimes(1);
    expect(a.onIrAInicio).not.toHaveBeenCalled();
  });

  it('a failed read offers the retry', () => {
    const a = montar({ state: 'error', data: null });
    expect(screen.getByTestId('turno-error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(a.onRetry).toHaveBeenCalled();
  });
});
