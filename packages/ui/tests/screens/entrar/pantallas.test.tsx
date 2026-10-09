/**
 * The entry screens (Track M, M-06) as the operator meets them: Vincular's
 * two paths, Acceso and Bloqueo on the NIP pad, the fondo sheet and Inicio's
 * situations. Presentational: every screen is fed its data.
 */
import { describe, expect, it, vi } from 'vitest';
import { INICIO_FIXTURE, type InicioData } from '@xangarro/caja/inicio';
import type { UserId } from '@xangarro/domain';
import { initI18n } from '../../../src/i18n/index';
import { AbrirTurnoSheet } from '../../../src/screens/AbrirTurno/abrir-turno-sheet';
import { ActivationScreen } from '../../../src/screens/Activation/activation-screen';
import { BloqueoScreen } from '../../../src/screens/Bloqueo/bloqueo-screen';
import { InicioScreen } from '../../../src/screens/Inicio/inicio-screen';
import { AccesoScreen } from '../../../src/screens/Login/acceso-screen';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

function tap(testID: string): void {
  const el = screen.getByTestId(testID);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

function typeInto(testID: string, value: string): void {
  const host = screen.getByTestId(testID);
  const input = host.tagName === 'INPUT' ? host : (host.querySelector('input') ?? host);
  fireEvent.change(input, { target: { value } });
}

const teclear = (nip: string): void => [...nip].forEach((d) => tap(`numpad-${d}`));

describe('Vincular', () => {
  it('opens on the camera with «Escribe el código» in the foot', () => {
    renderWithProviders(
      <ActivationScreen onSubmit={vi.fn()} onScan={vi.fn()} submitting={false} />,
    );
    expect(screen.getByTestId('vincular-visor')).toBeInTheDocument();
    expect(screen.getByText('Escanea el código del dueño')).toBeInTheDocument();
    expect(screen.getByTestId('vincular-escribir')).toBeInTheDocument();
  });

  it('the typed path waits for the correo and eight letters, then sends them clean', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ActivationScreen onSubmit={onSubmit} onScan={vi.fn()} submitting={false} />,
    );
    tap('vincular-escribir');
    expect(screen.getByTestId('activation-aviso')).toHaveTextContent(
      'Aviso completo y derechos ARCO',
    );
    tap('activation-submit');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Falta el correo del dueño.')).toBeInTheDocument();
    typeInto('activation-email', ' dueno@tacos.mx ');
    typeInto('activation-code', 'k7m3-p9rw');
    expect(screen.getByText('8 de 8')).toBeInTheDocument();
    tap('activation-submit');
    expect(onSubmit).toHaveBeenCalledWith({ email: 'dueno@tacos.mx', code: 'K7M3P9RW' });
  });

  it('shows the refusal for what was sent and drops it once edited', () => {
    const onSubmit = vi.fn();
    const ui = (errorKey: string | null) => (
      <ActivationScreen
        onSubmit={onSubmit}
        onScan={vi.fn()}
        submitting={false}
        errorKey={errorKey}
        vistaInicial="codigo"
      />
    );
    const r = renderWithProviders(ui(null));
    typeInto('activation-email', 'dueno@tacos.mx');
    typeInto('activation-code', 'K7M3P9RW');
    tap('activation-submit');
    r.rerender(ui('activate.errors.codeUsed'));
    expect(screen.getByTestId('activation-error')).toHaveTextContent('ya se usó');
    typeInto('activation-code', 'K7M3P9R');
    expect(screen.queryByTestId('activation-error')).toBeNull();
  });
});

const OPS = [
  { id: 'ana', nombre: 'Ana Robledo', iniciales: 'AR', detalle: 'Turno abierto desde las 08:15' },
  { id: 'luis', nombre: 'Luis Ortega', iniciales: 'LO' },
];

describe('Acceso', () => {
  it('greets whoever holds the turno and enters with four digits', () => {
    const onAuthenticate = vi.fn();
    renderWithProviders(
      <AccesoScreen
        operadores={OPS}
        contexto="Caja 1 · Taquería Don Pedro"
        fecha="Jueves 14 de mayo"
        dueno="Pedro"
        onAuthenticate={onAuthenticate}
        error={null}
        submitting={false}
      />,
    );
    expect(screen.getByText('¡Qué onda, Ana! Pon tu NIP y a vender.')).toBeInTheDocument();
    expect(screen.getByText('Caja 1 · Taquería Don Pedro')).toBeInTheDocument();
    tap('nip-enviar');
    expect(onAuthenticate).not.toHaveBeenCalled();
    teclear('47195');
    tap('nip-enviar');
    expect(onAuthenticate).toHaveBeenCalledWith('ana', '4719');
  });

  it('picking another person starts the NIP over and changes the greeting', () => {
    const onAuthenticate = vi.fn();
    renderWithProviders(
      <AccesoScreen
        operadores={OPS}
        contexto={null}
        fecha="Jueves 14 de mayo"
        dueno={null}
        onAuthenticate={onAuthenticate}
        error={null}
        submitting={false}
      />,
    );
    teclear('12');
    tap('acceso-operador-luis');
    expect(screen.getByText('¡Qué onda, Luis! Pon tu NIP y a vender.')).toBeInTheDocument();
    expect(screen.getByTestId('nip-puntos').getAttribute('aria-label')).toBe(
      '0 de 4 números escritos',
    );
    tap('acceso-olvide');
    expect(screen.getByText(/Nadie más puede cambiarlo/)).toBeInTheDocument();
    expect(
      screen.getByText('¿Olvidaste tu NIP? Pídele al dueño que te lo cambie.'),
    ).toBeInTheDocument();
  });
});

describe('Bloqueo', () => {
  it('unlocks the same person, or hands over to Acceso', () => {
    const onUnlock = vi.fn();
    const onCambiar = vi.fn();
    renderWithProviders(
      <BloqueoScreen
        contexto="Caja 1 · Taquería Don Pedro"
        userId={'ana' as UserId}
        operador={OPS[0]!}
        onUnlock={onUnlock}
        onCambiar={onCambiar}
        error="Ese NIP no es. Revísalo e intenta otra vez."
        submitting={false}
      />,
    );
    expect(screen.getByRole('heading')).toHaveTextContent('Caja bloqueada');
    expect(screen.getByTestId('nip-error')).toHaveTextContent('Ese NIP no es');
    teclear('5678');
    tap('nip-enviar');
    expect(onUnlock).toHaveBeenCalledWith('ana', '5678');
    tap('bloqueo-cambiar');
    expect(onCambiar).toHaveBeenCalled();
    expect(screen.getByText('No soy Ana, cambiar de persona')).toBeInTheDocument();
  });
});

describe('Abrir turno', () => {
  it('starts on the last close, a chip or the keypad sets the fondo', () => {
    const onAbrir = vi.fn();
    renderWithProviders(
      <AbrirTurnoSheet
        open
        onClose={vi.fn()}
        nombre="Ana"
        ultimo="Ayer terminaste con $800.00."
        sugerido={80_000n}
        onAbrir={onAbrir}
        submitting={false}
        error={null}
      />,
    );
    expect(screen.getByText('¡Hola, Ana! ¿Con cuánto empiezas?')).toBeInTheDocument();
    expect(screen.getByTestId('caja-abrir-submit')).toHaveTextContent('Abrir turno con $800.00');
    tap('fondo-rapido-1000');
    expect(screen.getByTestId('caja-abrir-submit')).toHaveTextContent('Abrir turno con $1,000.00');
    teclear('25');
    tap('numpad-dot');
    teclear('5');
    tap('caja-abrir-submit');
    expect(onAbrir).toHaveBeenCalledWith(2_550n);
  });

  it('won’t open on an empty figure', () => {
    const onAbrir = vi.fn();
    renderWithProviders(
      <AbrirTurnoSheet
        open
        onClose={vi.fn()}
        nombre={null}
        ultimo={null}
        sugerido={null}
        onAbrir={onAbrir}
        submitting={false}
        error={null}
      />,
    );
    tap('caja-abrir-submit');
    expect(onAbrir).not.toHaveBeenCalled();
    expect(screen.getByText(/Si no dejaste fondo, pon 0.00/)).toBeInTheDocument();
  });
});

const hoyNo = { ocultos: [] as string[], ocultar: vi.fn(), mostrarTodo: vi.fn() };

function inicio(
  data: InicioData,
  extra: { onNavigate?: () => void; onAbrirTurno?: () => void } = {},
) {
  renderWithProviders(
    <InicioScreen
      state="happy"
      data={data}
      hoyNo={hoyNo}
      onNavigate={extra.onNavigate ?? vi.fn()}
      onAbrirTurno={extra.onAbrirTurno ?? vi.fn()}
      onRetry={vi.fn()}
      layout="phone"
    />,
  );
}

describe('Inicio', () => {
  it('selling: the greeting, «Cobrar», the figures, «Para hoy» and the closes', () => {
    const onNavigate = vi.fn();
    inicio({ ...INICIO_FIXTURE, momento: 'tarde' }, { onNavigate });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Buenas tardes, Ana!');
    expect(screen.getByTestId('inicio-hero-listo')).toBeInTheDocument();
    tap('inicio-hero-accion');
    expect(onNavigate).toHaveBeenCalledWith('/cobrar');
    expect(screen.getAllByTestId('inicio-kpi')).toHaveLength(4);
    expect(screen.getByTestId('inicio-para-hoy')).toHaveTextContent('Para hoy');
    expect(screen.getByTestId('inicio-cortes')).toHaveTextContent('Cuadró');
    tap('inicio-atajo-gastos');
    expect(onNavigate).toHaveBeenCalledWith('/gastos');
  });

  it('turno cerrado: «Abrir turno» opens the fondo sheet and «Para hoy» waits', () => {
    const onAbrirTurno = vi.fn();
    inicio({ ...INICIO_FIXTURE, situacion: 'turno-cerrado' }, { onAbrirTurno });
    expect(screen.getByTestId('inicio-hero-cerrado')).toHaveTextContent(
      'Abre tu turno para empezar',
    );
    tap('inicio-hero-accion');
    expect(onAbrirTurno).toHaveBeenCalled();
    expect(screen.getByText('Tus pendientes salen al abrir el turno')).toBeInTheDocument();
  });

  it('hora de cerrar and sin conexión take the card', () => {
    inicio({ ...INICIO_FIXTURE, situacion: 'hora-de-cerrar' });
    expect(screen.getByTestId('inicio-hero-cerrar')).toHaveTextContent('Cerrar mi turno');
  });

  it('offline: «Ver pendientes» and «Seguir cobrando»', () => {
    const onNavigate = vi.fn();
    inicio({ ...INICIO_FIXTURE, offline: true, pendientes: 3 }, { onNavigate });
    expect(screen.getByTestId('inicio-hero-offline')).toHaveTextContent('3 sin enviar');
    tap('inicio-hero-accion');
    expect(onNavigate).toHaveBeenCalledWith('/no-enviados');
    tap('inicio-hero-extra');
    expect(onNavigate).toHaveBeenCalledWith('/cobrar');
  });

  it('«Hoy no» puts a row off', () => {
    inicio(INICIO_FIXTURE);
    const primera = INICIO_FIXTURE.tareas[0]!;
    tap(`inicio-tarea-hoy-no-${primera.id}`);
    expect(hoyNo.ocultar).toHaveBeenCalledWith(primera.id);
  });
});
