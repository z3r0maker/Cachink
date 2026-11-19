/**
 * Cierre de turno in two steps (M-17, MvCierreFlujo; ADR-147): the count
 * without the esperado, then the result said as cuadra, falta or sobra with
 * its reason, «Volver a contar» keeping the count, the band that never
 * blocks the close (ADR-123), the close write (happy and its failures) and
 * the hecho it ends on: the corte, its reminder, the send sheet and
 * «Abrir otro turno». The owner is «los patrones», never a name.
 */
import { describe, expect, it, vi } from 'vitest';
import { Linking } from 'react-native';
import {
  CIERRE_FIXTURE,
  CONTEO_CUADRA,
  CONTEO_FALTA,
  CONTEO_SOBRA,
  estadoDelConteo,
} from '@xangarro/caja/cierre';
import { initI18n } from '../src/i18n/index';
import { CierreScreen } from '../src/screens/Turno/cierre-screen';
import { CierreHecho } from '../src/screens/Turno/cierre-hecho';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const COLA = {
  porEnviar: 0,
  reintentando: 0,
  sinRed: false,
  enviando: false,
  onReintentar: () => undefined,
};

function montar(over: Record<string, unknown> = {}) {
  const onCerrar = vi.fn(async () => null);
  const onSalir = vi.fn();
  const onAbrirTurno = vi.fn();
  const onOtroTurno = vi.fn();
  const pantalla = (mas: Record<string, unknown> = {}) => (
    <CierreScreen
      state="happy"
      data={CIERRE_FIXTURE}
      cola={COLA}
      onCerrar={onCerrar}
      onRetry={() => undefined}
      onSalir={onSalir}
      onAbrirTurno={onAbrirTurno}
      onOtroTurno={onOtroTurno}
      {...over}
      {...mas}
    />
  );
  const { rerender } = renderWithProviders(pantalla());
  return {
    onCerrar,
    onSalir,
    onAbrirTurno,
    onOtroTurno,
    rerender: (mas: Record<string, unknown>) => rerender(pantalla(mas)),
  };
}

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

const escribir = (id: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(id), { target: { value: texto } });
};

/** Types a whole count at once, one field per denomination, then «Ver resultado». */
function contarYVer(conteo: Record<string, number>): void {
  for (const [clave, n] of Object.entries(conteo)) escribir(`conteo-cantidad-${clave}`, String(n));
  tap('cierre-ver-resultado');
}

describe('Cierre · paso 1, contar', () => {
  it('counts without the esperado in sight; the foot carries the running total', () => {
    montar();
    expect(screen.getByTestId('cierre-paso-contar').textContent).toContain('Paso 1 de 2');
    expect(screen.getByTestId('cierre-paso-contar').textContent).toContain('Cuenta la caja');
    for (const [clave, n] of Object.entries(CONTEO_CUADRA)) {
      escribir(`conteo-cantidad-${clave}`, String(n));
    }
    expect(screen.getByTestId('cierre-contado').textContent).toBe('$2,710.00');
    expect(screen.queryByTestId('cierre-esperado')).toBeNull();
    expect(screen.queryByText('Fondo de caja')).toBeNull();
    expect(screen.queryByTestId('cierre-cerrar-turno')).toBeNull();
  });

  it('a stepper adds and removes pieces, never below zero; «Empezar de cero» clears', () => {
    montar();
    tap('conteo-mas-billete-500');
    tap('conteo-mas-billete-500');
    tap('conteo-menos-billete-500');
    expect(screen.getByTestId('cierre-contado').textContent).toBe('$500.00');
    escribir('conteo-cantidad-billete-500', '0');
    tap('conteo-menos-billete-500');
    expect((screen.getByTestId('conteo-cantidad-billete-500') as HTMLInputElement).value).toBe('0');
    tap('conteo-mas-moneda-10');
    tap('cierre-empezar-de-cero');
    expect(screen.getByTestId('cierre-contado').textContent).toBe('$0.00');
  });

  it('the route can own the step: «Ver resultado» reports it', () => {
    const onPaso = vi.fn();
    montar({ onPaso });
    tap('cierre-ver-resultado');
    expect(onPaso).toHaveBeenCalledWith('resultado');
  });
});

describe('Cierre · paso 2, resultado', () => {
  it('cuadra: the title says so, the four parts explain the esperado, no motivo asked', () => {
    montar();
    contarYVer(CONTEO_CUADRA);
    expect(screen.getByTestId('cierre-paso-resultado').textContent).toContain('¡Cuadra!');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('$0.00');
    expect(screen.getByTestId('cierre-esperado').textContent).toBe('$2,710.00');
    expect(screen.getByTestId('cierre-desglose').textContent).toContain('Fondo de caja');
    expect(screen.getByTestId('cierre-desglose').textContent).toContain('−$620.00');
    expect(screen.queryByTestId('cierre-motivo-Cambio mal dado')).toBeNull();
    expect(screen.getByTestId('cierre-cerrar-turno').textContent).toBe('Cerrar turno');
    expect(screen.getByTestId('cierre-cerrar').textContent).toContain('abres otro turno');
  });

  it('falta: waits for its motivo; «Volver a contar» keeps the count', () => {
    const { onCerrar } = montar();
    contarYVer(CONTEO_FALTA);
    expect(screen.getByTestId('cierre-paso-resultado').textContent).toContain('Falta efectivo');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('$70.00');
    expect(screen.getByTestId('cierre-cerrar-turno').textContent).toContain(
      'Cerrar turno con faltante de $70.00',
    );
    tap('cierre-cerrar-turno');
    expect(onCerrar).not.toHaveBeenCalled();
    tap('cierre-volver-a-contar');
    expect(screen.getByTestId('cierre-contado').textContent).toBe('$2,640.00');
  });

  it('a motivo unlocks the close; «Otra razón» waits for its note to los patrones', async () => {
    const { onCerrar } = montar();
    contarYVer(CONTEO_FALTA);
    tap('cierre-motivo-Otra razón');
    expect(screen.getByText('Nota para los patrones')).toBeInTheDocument();
    tap('cierre-cerrar-turno');
    expect(onCerrar).not.toHaveBeenCalled();
    expect(screen.getByTestId('cierre-cerrar').textContent).toContain(
      'Escribe la nota para poder cerrar',
    );
    escribir('cierre-nota', ' Se cayó el sobre de cambio ');
    tap('cierre-cerrar-turno');
    await waitFor(() => expect(onCerrar).toHaveBeenCalledOnce());
    expect(onCerrar.mock.calls[0]?.[0]).toMatchObject({
      montoCierreCentavos: 264_000n,
      discrepancyReason: 'otro',
      explicacion: 'Se cayó el sobre de cambio',
    });
  });

  it('sobra says so in its title and card', () => {
    montar();
    contarYVer(CONTEO_SOBRA);
    expect(screen.getByTestId('cierre-paso-resultado').textContent).toContain('Sobra efectivo');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('$910.00');
  });

  it('a drawer counted at $0.00 shows the motivos and can close (review M6)', async () => {
    const { onCerrar } = montar();
    tap('cierre-ver-resultado');
    expect(screen.getByTestId('cierre-cerrar-turno').textContent).toContain(
      'faltante de $2,710.00',
    );
    tap('cierre-motivo-Salió un vale');
    tap('cierre-cerrar-turno');
    await waitFor(() => expect(onCerrar).toHaveBeenCalledOnce());
    expect(onCerrar.mock.calls[0]?.[0]).toMatchObject({ montoCierreCentavos: 0n });
  });
});

describe('Cierre · the close write', () => {
  it('happy: closes with the conteo and its denominaciones, then the hecho', async () => {
    const onPaso = vi.fn();
    const onReintentar = vi.fn();
    const { onCerrar, rerender } = montar({ onPaso, cola: { ...COLA, onReintentar } });
    contarYVer(CONTEO_CUADRA);
    tap('cierre-cerrar-turno');
    await waitFor(() => expect(onCerrar).toHaveBeenCalledOnce());
    expect(onCerrar.mock.calls[0]?.[0]).toMatchObject({
      montoCierreCentavos: 271_000n,
      discrepancyReason: null,
      explicacion: null,
    });
    expect(onCerrar.mock.calls[0]?.[0]?.denominaciones).toEqual({ ...CONTEO_CUADRA });
    await waitFor(() => expect(screen.getByTestId('cierre-hecho')).toBeInTheDocument());
    expect(onPaso).toHaveBeenLastCalledWith('hecho');
    // The close is sent right away, and nothing is claimed until a run confirms it (M7).
    expect(onReintentar).toHaveBeenCalledTimes(1);
    const t = screen.getByTestId('cierre-hecho').textContent ?? '';
    expect(t).toContain('¡Turno cerrado!');
    expect(t).toContain('Los patrones lo verán en su portal en cuanto se envíe.');
    // The owner («Pedro» in the fixture) is never named; only the business is.
    expect(t).not.toMatch(/Pedro (ya|lo)|dueño/);
    // A run from before the close confirms nothing; one after it does.
    rerender({ cola: { ...COLA, ultimoEnvio: '2020-01-01T00:00:00.000Z' } });
    expect(screen.getByTestId('cierre-hecho').textContent).not.toContain('ya lo tienen');
    rerender({ cola: { ...COLA, ultimoEnvio: new Date(Date.now() + 1000).toISOString() } });
    expect(screen.getByTestId('cierre-hecho').textContent).toContain(
      'Los patrones ya lo tienen en su portal. Gracias por tu turno, Ana.',
    );
  });

  it('a failed write says so and stays on the result to retry', async () => {
    const fallo = 'No se pudo cerrar el turno: ya fue cerrado';
    montar({ onCerrar: vi.fn(async () => fallo) });
    contarYVer(CONTEO_CUADRA);
    tap('cierre-cerrar-turno');
    await waitFor(() =>
      expect(screen.getByTestId('cierre-error-cerrar').textContent).toContain(fallo),
    );
    expect(screen.queryByTestId('cierre-hecho')).toBeNull();
    expect(screen.getByTestId('cierre-cerrar-turno')).toBeInTheDocument();
  });

  it('with records to send the band warns and the close still goes through (ADR-123)', async () => {
    montar({ cola: { ...COLA, porEnviar: 3, reintentando: 2 } });
    contarYVer(CONTEO_CUADRA);
    expect(screen.getByTestId('cierre-por-enviar').textContent).toContain(
      'Tienes 3 registros por enviar (2 se reintentarán solos).',
    );
    tap('cierre-cerrar-turno');
    await waitFor(() => expect(screen.getByTestId('cierre-hecho')).toBeInTheDocument());
    expect(screen.getByTestId('cierre-hecho').textContent).toContain(
      'Los patrones lo verán en su portal en cuanto se envíe.',
    );
  });

  it('sin-turno: nothing to close, and the turno opens from here', () => {
    const { onSalir, onAbrirTurno } = montar({ state: 'sin-turno', data: null });
    expect(screen.getByTestId('cierre-sin-turno').textContent).toContain('No hay nada que cerrar');
    tap('cierre-sin-turno-cta');
    expect(onAbrirTurno).toHaveBeenCalledTimes(1);
    expect(onSalir).not.toHaveBeenCalled();
  });
});

describe('CierreHecho · the corte and the way on', () => {
  const hecho = (conteo: Record<string, number>, motivo: string | null) => {
    const onOtroTurno = vi.fn();
    const onSalir = vi.fn();
    renderWithProviders(
      <CierreHecho
        data={CIERRE_FIXTURE}
        e={estadoDelConteo(conteo, CIERRE_FIXTURE.partes, null, '')}
        motivo={motivo as never}
        enviado
        onOtroTurno={onOtroTurno}
        onSalir={onSalir}
      />,
    );
    return { onOtroTurno, onSalir };
  };

  it('faltante: the chip, the line, the corte and the reminder, with no handover dialog', () => {
    hecho(CONTEO_FALTA, 'Cambio mal dado');
    const t = screen.getByTestId('cierre-hecho').textContent ?? '';
    expect(t).toContain('Con un faltante de $70.00');
    expect(t).toContain('Quedó un faltante explicado como «Cambio mal dado»');
    expect(screen.getByTestId('cierre-corte').textContent).toContain('Taquería Don Pedro');
    expect(screen.getByTestId('cierre-corte-diferencia').textContent).toContain('−$70.00');
    expect(screen.getByTestId('cierre-recordatorio').textContent).toBe(
      'Guarda $2,640.00 para los patrones.',
    );
    expect(screen.queryByTestId('cierre-entregar-efectivo')).toBeNull();
  });

  it('sobrante: said as such, signed on the corte', () => {
    hecho(CONTEO_SOBRA, 'Venta no registrada');
    expect(screen.getByTestId('cierre-hecho').textContent).toContain('Con un sobrante de $910.00');
    expect(screen.getByTestId('cierre-corte-diferencia').textContent).toContain('+$910.00');
  });

  it('«Mandar el corte» shows the message and opens WhatsApp with it', async () => {
    const abre = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    hecho(CONTEO_CUADRA, null);
    tap('cierre-mandar');
    const mensaje = screen.getByTestId('corte-mensaje').textContent ?? '';
    expect(mensaje).toContain('Corte de caja · Taquería Don Pedro');
    expect(mensaje).toContain('Contado: $2,710.00');
    expect(mensaje).toContain('Cuadró al centavo.');
    tap('corte-whatsapp');
    await waitFor(() => expect(abre).toHaveBeenCalled());
    expect(String(abre.mock.calls[0]?.[0])).toContain(encodeURIComponent('Corte de caja'));
    await waitFor(() => expect(screen.getByTestId('corte-aviso')).toBeInTheDocument());
    abre.mockRestore();
  });

  it('Mensajes names the corte, not a comprobante', async () => {
    const abre = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    hecho(CONTEO_CUADRA, null);
    tap('cierre-mandar');
    tap('corte-mensajes');
    await waitFor(() =>
      expect(screen.getByTestId('corte-aviso').textContent).toContain('Mensajes con el corte'),
    );
    abre.mockRestore();
  });

  it('«Abrir otro turno» and «Salir» hand over to the route', () => {
    const { onOtroTurno, onSalir } = hecho(CONTEO_CUADRA, null);
    tap('cierre-otro-turno');
    expect(onOtroTurno).toHaveBeenCalledTimes(1);
    tap('cierre-salir');
    expect(onSalir).toHaveBeenCalledTimes(1);
  });
});
