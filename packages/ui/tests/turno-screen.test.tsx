/**
 * Mi turno (Track M, M-09, the Turno board): the hero says the expected cash
 * and its four parts, the four figures with their hints, the movements and
 * the due gastos; sin-turno says its way forward; and with records still to
 * send the band warns while «Cerrar mi turno» stays (ADR-123).
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
  onRetry: vi.fn(),
  onIrAInicio: vi.fn(),
  onVerVentas: vi.fn(),
  onRegistrar: vi.fn(),
};

function montar(over: Record<string, unknown> = {}) {
  renderWithProviders(
    <MiTurnoScreen state="happy" data={TURNO_FIXTURE} cola={COLA} {...ACCIONES} {...over} />,
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
  it('says the expected cash, its four parts and the way to close', () => {
    montar();
    expect(screen.getByText('Mi turno')).toBeInTheDocument();
    expect(screen.getByText('Ana Robledo, Caja 1, desde las 08:15')).toBeInTheDocument();
    expect(screen.getAllByText('$2,710.00').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Fondo de caja')).toBeInTheDocument();
    expect(screen.getByText('+$1,980.00')).toBeInTheDocument();
    expect(screen.getByText('+$550.00')).toBeInTheDocument();
    expect(screen.getAllByText('−$620.00').length).toBe(2);
    expect(screen.getByText('Debe haber')).toBeInTheDocument();
  });

  it('says the four figures with their hints, and the movements below', () => {
    montar();
    expect(screen.getByText('$3,120.00')).toBeInTheDocument();
    expect(screen.getByText('Una cancelada a las 12:58')).toBeInTheDocument();
    expect(screen.getByText('Dos clientes')).toBeInTheDocument();
    expect(screen.getByText('Salieron de la caja · 4 comprobantes')).toBeInTheDocument();
    expect(screen.getByTestId('turno-movimiento-v412')).toBeInTheDocument();
    expect(screen.getByTestId('turno-movimiento-merma')).toBeInTheDocument();
    expect(screen.getByText('Sin monto')).toBeInTheDocument();
    expect(screen.getByTestId('turno-movimiento-gas').textContent).toContain('−$620.00');
  });

  it('the due gastos wait with their Registrar, and «Cerrar mi turno» opens the flow', () => {
    const a = montar();
    expect(screen.getByTestId('turno-pendiente-gas')).toBeInTheDocument();
    expect(screen.getByTestId('turno-pendiente-renta').textContent).toContain('Vence hoy');
    expect(screen.getByTestId('turno-pendiente-agua').textContent).toContain('Atrasado 1 día');
    tap('turno-registrar-gas');
    expect(a.onRegistrar).toHaveBeenCalledWith(TURNO_FIXTURE.pendientes[0]);
    tap('turno-cerrar-mi-turno');
    expect(a.onCerrar).toHaveBeenCalled();
  });

  it('an open turno with nothing captured says it is en blanco, figures standing', () => {
    montar({ data: { ...TURNO_FIXTURE, movimientos: [] }, state: 'empty' });
    expect(screen.getByTestId('turno-movimientos-vacio').textContent).toContain(
      'Tu turno va en blanco',
    );
    expect(screen.getAllByText('$2,710.00').length).toBeGreaterThan(0);
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
  it('sin-turno points to Inicio', () => {
    const a = montar({ state: 'sin-turno', data: null });
    expect(screen.getByTestId('turno-sin-turno').textContent).toContain('Sin turno abierto');
    tap('turno-ir-inicio');
    expect(a.onIrAInicio).toHaveBeenCalled();
  });

  it('a failed read offers the retry', () => {
    const a = montar({ state: 'error', data: null });
    expect(screen.getByTestId('turno-error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(a.onRetry).toHaveBeenCalled();
  });
});
