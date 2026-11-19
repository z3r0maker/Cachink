/**
 * One tap from a closed turno to the fondo sheet (board MvTurnoCerrado):
 * Cobrar's gate says what to do and `useAperturaTurno` opens the sheet over
 * the screen the operator is on. Opening closes it and runs what the route
 * asked for; «Ahorita no», a failed open and a missing operator do not.
 */
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/i18n/index';
import { useAperturaTurno } from '../../src/screens/AbrirTurno/use-apertura-turno';
import { CajaGateBanner } from '../../src/screens/Ventas/caja-gate-banner';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const h = vi.hoisted(() => ({
  userId: 'usuario-1' as string | null,
  error: null as Error | null,
  mutate: vi.fn(),
}));

vi.mock('../../src/hooks/use-abrir-caja', () => ({
  useAbrirCaja: () => ({ isPending: false, error: h.error, mutate: h.mutate }),
}));
vi.mock('../../src/app/repository-provider', () => ({
  useCajaTurnosRepository: () => ({ findLatest: async () => null }),
}));
vi.mock('../../src/app-config/use-app-config', () => ({
  useCurrentBusinessId: () => 'negocio-1',
  useUserId: () => h.userId,
}));
vi.mock('../../src/screens/AppShell/use-shell-data', () => ({
  useShellData: () => ({ operador: { nombre: 'Ana Robledo', iniciales: 'AR' } }),
}));

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

function Pantalla(p: { readonly onAbierto?: () => void }): ReactElement {
  const apertura = useAperturaTurno(p.onAbierto);
  return (
    <>
      <CajaGateBanner onAbrirTurno={apertura.abrir} />
      {apertura.hoja}
    </>
  );
}

function abrirConFondo(onAbierto = vi.fn()) {
  renderWithProviders(
    <QueryClientProvider client={new QueryClient()}>
      <Pantalla onAbierto={onAbierto} />
    </QueryClientProvider>,
  );
  tap('caja-gate-banner-cta');
  tap('fondo-rapido-500');
  return onAbierto;
}

beforeEach(() => {
  h.userId = 'usuario-1';
  h.error = null;
  h.mutate.mockReset();
});

describe('CajaGateBanner', () => {
  it('says what is missing and offers «Abrir turno» itself', () => {
    const onAbrirTurno = vi.fn();
    renderWithProviders(<CajaGateBanner onAbrirTurno={onAbrirTurno} />);
    expect(screen.getByTestId('caja-gate-banner')).toHaveTextContent('Abre tu turno para cobrar');
    expect(screen.queryByText('Ir a Caja')).toBeNull();
    expect(screen.getByTestId('caja-gate-banner-cta')).toHaveTextContent('Abrir turno');
    tap('caja-gate-banner-cta');
    expect(onAbrirTurno).toHaveBeenCalledTimes(1);
  });
});

describe('useAperturaTurno', () => {
  it('opens the sheet here; a successful open closes it and continues', async () => {
    h.mutate.mockImplementation((_input, opts: { onSuccess: () => void }) => opts.onSuccess());
    const onAbierto = abrirConFondo();
    expect(screen.getByTestId('abrir-caja-modal')).toBeInTheDocument();
    tap('caja-abrir-submit');
    expect(h.mutate.mock.calls[0]?.[0]).toEqual({
      userId: 'usuario-1',
      montoAperturaCentavos: 50_000n,
    });
    await waitFor(() => expect(screen.queryByTestId('abrir-caja-modal')).toBeNull());
    expect(onAbierto).toHaveBeenCalledTimes(1);
  });

  it('«Ahorita no» closes the sheet without opening or continuing', async () => {
    const onAbierto = abrirConFondo();
    tap('abrir-ahorita-no');
    await waitFor(() => expect(screen.queryByTestId('abrir-caja-modal')).toBeNull());
    expect(h.mutate).not.toHaveBeenCalled();
    expect(onAbierto).not.toHaveBeenCalled();
  });

  it('a failed open keeps the sheet up, says why and does not continue', () => {
    h.error = new Error('Ya hay un turno abierto');
    const onAbierto = abrirConFondo();
    tap('caja-abrir-submit');
    expect(screen.getByTestId('abrir-error')).toHaveTextContent('Ya hay un turno abierto');
    expect(screen.getByTestId('abrir-caja-modal')).toBeInTheDocument();
    expect(onAbierto).not.toHaveBeenCalled();
  });

  it('with nobody signed in nothing is opened', () => {
    h.userId = null;
    const onAbierto = abrirConFondo();
    tap('caja-abrir-submit');
    expect(h.mutate).not.toHaveBeenCalled();
    expect(onAbierto).not.toHaveBeenCalled();
  });
});
