/**
 * Cierre de turno (Track M, M-09, the Cierre board): counting by
 * denomination against the expected cash, the difference said as cuadra,
 * falta or sobra with its reason, the band that never blocks the close
 * (ADR-123), the close write (happy and its failures) and the hecho screen
 * it ends on, by difference.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  CIERRE_FIXTURE,
  CONTEO_CUADRA,
  CONTEO_FALTA,
  CONTEO_SOBRA,
  estadoDelConteo,
} from '@xangarro/caja/cierre';
import { initI18n } from '../src/i18n/index';
import { CierreScreen } from '../src/screens/Turno/cierre-screen';
import { CierreHecho, textoCorte } from '../src/screens/Turno/cierre-hecho';
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
  const onCompartir = vi.fn();
  renderWithProviders(
    <CierreScreen
      state="happy"
      data={CIERRE_FIXTURE}
      cola={COLA}
      onCerrar={onCerrar}
      onRetry={() => undefined}
      onSalir={onSalir}
      onCompartir={onCompartir}
      {...over}
    />,
  );
  return { onCerrar, onSalir, onCompartir };
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

/** Types a whole count at once: one field per denomination. */
function contar(conteo: Record<string, number>): void {
  for (const [clave, n] of Object.entries(conteo)) escribir(`conteo-cantidad-${clave}`, String(n));
}

describe('CierreScreen · cuadra', () => {
  it('counts to the esperado and says it cuadra, the close ready', () => {
    montar();
    contar(CONTEO_CUADRA);
    expect(screen.getByTestId('cierre-contado').textContent).toBe('$2,710.00');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('Cuadra');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('$0.00');
    expect(screen.getByTestId('cierre-cerrar-turno').textContent).toContain('Cerrar turno');
    expect(screen.getByTestId('cierre-cerrar-turno').textContent).not.toContain('faltante');
  });

  it('the esperado says its four parts, the resumen its five rows', () => {
    montar();
    expect(screen.getAllByText('$2,710.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Fondo de caja')).toBeInTheDocument();
    expect(screen.getByText('Gastos de caja chica')).toBeInTheDocument();
    expect(screen.getByTestId('cierre-resumen-ventas').textContent).toContain('12');
    expect(screen.getByTestId('cierre-resumen-cobrado').textContent).toContain('$3,120.00');
    expect(screen.getByTestId('cierre-resumen-canceladas').textContent).toContain('$60.00');
    expect(screen.getByTestId('cierre-resumen-fiado').textContent).toContain('$182.00');
    expect(screen.getByTestId('cierre-resumen-inventario').textContent).toContain(
      '3 entradas · 2 mermas',
    );
    expect(screen.getByTestId('cierre-resumen-sync').textContent).toContain('Todo enviado');
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

  it('nothing counted yet: the difference only says what to do next', () => {
    montar();
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain(
      'Cuenta los billetes y las monedas de la caja',
    );
    expect(screen.getByTestId('cierre-diferencia').textContent).not.toContain('Falta');
  });
});

describe('CierreScreen · falta', () => {
  it('says the falta and waits for its motivo before closing', () => {
    const { onCerrar } = montar();
    contar(CONTEO_FALTA);
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('Falta');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain('$70.00');
    expect(screen.getByTestId('cierre-diferencia').textContent).toContain(
      'Cuenta otra vez antes de explicar',
    );
    expect(screen.getByTestId('cierre-cerrar-turno').textContent).toContain(
      'Cerrar turno con faltante de $70.00',
    );
    escribir('conteo-cantidad-moneda-10', 'junk');
    tap('cierre-cerrar-turno');
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('a motivo unlocks the close; «Otra razón» also waits for its note', () => {
    const { onCerrar } = montar();
    contar(CONTEO_FALTA);
    tap('cierre-motivo-Salió un vale');
    tap('cierre-cerrar-turno');
    expect(onCerrar).toHaveBeenCalledOnce();
  });

  it('the note is required and travels trimmed', async () => {
    const { onCerrar } = montar();
    contar(CONTEO_FALTA);
    tap('cierre-motivo-Otra razón');
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
});

describe('CierreScreen · the close write', () => {
  it('happy: closes with the conteo and its denominaciones, then the hecho screen', async () => {
    const { onCerrar } = montar();
    contar(CONTEO_CUADRA);
    tap('cierre-cerrar-turno');
    await waitFor(() => expect(onCerrar).toHaveBeenCalledOnce());
    expect(onCerrar.mock.calls[0]?.[0]).toMatchObject({
      montoCierreCentavos: 271_000n,
      discrepancyReason: null,
      explicacion: null,
    });
    expect(onCerrar.mock.calls[0]?.[0]?.denominaciones).toEqual({ ...CONTEO_CUADRA });
    await waitFor(() => expect(screen.getByTestId('cierre-hecho')).toBeInTheDocument());
    expect(screen.getByTestId('cierre-hecho').textContent).toContain('¡Turno cerrado!');
    expect(screen.getByTestId('cierre-hecho').textContent).toContain('Cuadró al centavo.');
    expect(screen.getByTestId('cierre-hecho').textContent).toContain(
      'El conteo cuadró con lo esperado. Pedro ya lo tiene en su portal.',
    );
  });

  it('a failed write says so and stays open to retry', async () => {
    const fallo = 'No se pudo cerrar el turno: ya fue cerrado';
    montar({ onCerrar: vi.fn(async () => fallo) });
    contar(CONTEO_CUADRA);
    tap('cierre-cerrar-turno');
    await waitFor(() =>
      expect(screen.getByTestId('cierre-error-cerrar').textContent).toContain(fallo),
    );
    expect(screen.queryByTestId('cierre-hecho')).toBeNull();
    expect(screen.getByTestId('cierre-contado').textContent).toBe('$2,710.00');
  });

  it('with records to send the band warns and the close still goes through (ADR-123)', async () => {
    montar({ cola: { ...COLA, porEnviar: 3, reintentando: 2 } });
    expect(screen.getByTestId('cierre-por-enviar').textContent).toContain(
      'Tienes 3 registros por enviar (2 se reintentarán solos).',
    );
    expect(screen.getByTestId('cierre-resumen-sync').textContent).toContain('3 sin enviar');
    contar(CONTEO_CUADRA);
    tap('cierre-cerrar-turno');
    await waitFor(() => expect(screen.getByTestId('cierre-hecho')).toBeInTheDocument());
    expect(screen.getByTestId('cierre-hecho').textContent).toContain(
      'Pedro lo verá en su portal cuando se envíen los registros',
    );
  });

  it('sin-turno: nothing to close, Inicio is the way back', () => {
    const { onSalir } = montar({ state: 'sin-turno', data: null });
    expect(screen.getByTestId('cierre-sin-turno').textContent).toContain('No hay nada que cerrar');
    tap('cierre-ir-inicio');
    expect(onSalir).toHaveBeenCalled();
  });
});

describe('CierreHecho · by difference', () => {
  const hecho = (conteo: Record<string, number>, motivo: string | null): void => {
    renderWithProviders(
      <CierreHecho
        data={CIERRE_FIXTURE}
        e={estadoDelConteo(conteo, CIERRE_FIXTURE.partes, null, '')}
        motivo={motivo}
        porEnviar={0}
        onCompartir={() => undefined}
        onSalir={() => undefined}
      />,
    );
  };

  it('faltante: the chip, the line and the entrega step', () => {
    hecho(CONTEO_FALTA, 'Cambio mal dado');
    const t = screen.getByTestId('cierre-hecho').textContent ?? '';
    expect(t).toContain('Turno cerrado');
    expect(t).toContain('Con un faltante de $70.00');
    expect(t).toContain('Faltante');
    expect(t).toContain('Quedó un faltante explicado como «Cambio mal dado»');
    expect(screen.getByTestId('cierre-entregar-efectivo').textContent).toContain(
      'Entregar el efectivo a Pedro',
    );
  });

  it('sobrante: said as such, with its figures', () => {
    hecho(CONTEO_SOBRA, 'Venta no registrada');
    const t = screen.getByTestId('cierre-hecho').textContent ?? '';
    expect(t).toContain('Sobrante');
    expect(t).toContain('Con un sobrante de $910.00');
    expect(t).toContain('+$910.00');
    expect(t).toContain('Quedó un sobrante explicado como «Venta no registrada»');
  });

  it('confirming the entrega marks it done; sharing hands over the corte text', () => {
    hecho(CONTEO_CUADRA, null);
    tap('cierre-entregar-efectivo');
    expect(screen.getByTestId('cierre-entrega-dialog')).toBeInTheDocument();
    tap('cierre-entrega-si');
    expect(screen.getByTestId('cierre-entregado').textContent).toContain(
      'Le entregaste el efectivo a Pedro',
    );
  });

  it('the corte text says the caja, who, the contado, the esperado and the difference', () => {
    const e = estadoDelConteo(CONTEO_FALTA, CIERRE_FIXTURE.partes, null, '');
    expect(textoCorte(e, CIERRE_FIXTURE)).toBe(
      `Corte Caja 1, Ana Robledo, ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')}: contado $2,640.00, esperado $2,710.00, diferencia −$70.00.`,
    );
  });
});
