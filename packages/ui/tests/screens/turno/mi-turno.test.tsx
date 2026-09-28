/**
 * Mi turno (M-09): the phone's rows said as the web's turno, with cash abonos
 * in the expected cash (the M-08 gap), the rows' live lines, and the screen.
 */
import { describe, expect, it, vi } from 'vitest';
import { inicioMovil, type FilasInicio } from '../../../src/screens/Inicio/inicio-filas';
import { MiTurnoScreen } from '../../../src/screens/MiTurno/mi-turno-screen';
import { filasVivas, miTurnoMovil } from '../../../src/screens/MiTurno/mi-turno-vista';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';
import { FILAS, HOY, turno } from './filas';

initI18n();

const AHORA = new Date(2026, 4, 14, 15, 0);
const ENTORNO = { operador: 'Ana Robledo', caja: 'Caja 1', hoy: HOY, ahora: AHORA };

function filas(p: Partial<FilasInicio> = {}): FilasInicio {
  return {
    turno: turno(),
    ...FILAS,
    turnos: [],
    recurrentes: [],
    stock: [
      { id: 'P1', nombre: 'Pastor', existencias: 2, umbral: 5 },
      { id: 'P2', nombre: 'Queso oaxaca', existencias: 1, umbral: 3 },
      { id: 'P3', nombre: 'Refresco', existencias: 40, umbral: 10 },
    ],
    ...p,
  };
}

describe('the expected cash the phone shows', () => {
  it('counts cash abonos and only the turno’s gastos, as the close stores it', () => {
    const v = miTurnoMovil(filas(), ENTORNO);
    expect(v?.turno.abonosEfectivo).toBe(550_00n);
    expect(v?.turno.gastosEfectivo).toBe(620_00n);
    expect(v?.turno.esperado).toBe(2_710_00n);
  });

  it('Inicio says the same figure', () => {
    const d = inicioMovil(
      filas(),
      {
        nombre: 'Ana Robledo',
        negocio: null,
        caja: 'Caja 1',
        offline: false,
        pendientes: 0,
        ahora: AHORA,
        dueno: null,
      },
      HOY,
    );
    expect(d.turno?.esperado).toBe(2_710_00n);
  });

  it('has nothing to say with no turno open', () => {
    expect(miTurnoMovil(filas({ turno: null }), ENTORNO)).toBeNull();
    expect(
      miTurnoMovil(filas({ turno: turno({ cierreAt: '2026-05-14T20:00:00Z' }) }), ENTORNO),
    ).toBeNull();
  });
});

describe('the rows, live', () => {
  const gas = { id: 'R1', nombre: 'Gas', detalle: 'Cada semana', monto: 620_00n, vence: 0 };

  it('says what left the caja, fiado and abonos, what to restock and the queue', () => {
    const v = miTurnoMovil(filas(), ENTORNO);
    if (v === null) throw new Error('sin turno');
    const f = filasVivas(
      { ...v, turno: { ...v.turno, pendientes: [gas] } },
      { porEnviar: 0, rechazados: 0 },
    );
    expect(f.gastos).toEqual({
      detail: '$620.00 salieron de la caja',
      chip: { label: 'Gas vence hoy', tone: 'red' },
    });
    expect(f.cobranza?.detail).toBe('$182.00 fiado hoy · $650.00 en abonos');
    expect(f.inventario).toEqual({
      detail: 'Pastor y queso oaxaca',
      chip: { label: '2 por reponer', tone: 'amber' },
    });
    expect(f.pendientes?.chip).toEqual({ label: 'Todo enviado', tone: 'green' });
    expect(filasVivas(v, { porEnviar: 3, rechazados: 0 }).pendientes?.chip?.label).toBe(
      '3 sin enviar',
    );
    expect(filasVivas(v, { porEnviar: 3, rechazados: 1 }).pendientes?.chip?.tone).toBe('red');
    expect(filasVivas(v, { porEnviar: 0, rechazados: 0 }).gastos?.chip).toBeUndefined();
  });
});

describe('MiTurnoScreen', () => {
  const tap = (id: string): void => {
    const el = screen.getByTestId(id);
    fireEvent.pointerDown(el);
    fireEvent.pointerUp(el);
    fireEvent.click(el);
  };

  it('shows who, the expected cash with its parts, the figures, and closes', () => {
    const v = miTurnoMovil(filas(), ENTORNO);
    const onCerrar = vi.fn();
    renderWithProviders(
      <MiTurnoScreen
        state="happy"
        vista={v}
        vivas={{}}
        onNavigate={vi.fn()}
        onCerrar={onCerrar}
        onBloquear={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mi-turno-desde')).toHaveTextContent(
      'Ana Robledo, desde las 08:15 · jueves 14 de mayo',
    );
    expect(screen.getByTestId('mi-turno-esperado')).toHaveTextContent('$2,710.00');
    expect(screen.queryByTestId('esperado-desglose')).toBeNull();
    tap('mi-turno-desglose');
    expect(screen.getByTestId('esperado-desglose')).toHaveTextContent('+$550.00');
    tap('turno-cerrar');
    expect(onCerrar).toHaveBeenCalled();
    expect(screen.getByTestId('turno-bloquear')).toBeInTheDocument();
  });

  it('with no turno: the rows and the lock, no close', () => {
    renderWithProviders(
      <MiTurnoScreen
        state="sin-turno"
        vista={null}
        vivas={{}}
        onNavigate={vi.fn()}
        onCerrar={vi.fn()}
        onBloquear={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId('otros-gastos')).toBeInTheDocument();
    expect(screen.queryByTestId('turno-cerrar')).toBeNull();
  });
});
