import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import type { BusinessId, DeviceId, UserId } from '@xangarro/domain';

import { InMemoryCajaTurnosRepository } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';

import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';
import { act } from '@testing-library/react';

initI18n();

/**
 * CajaContent's state machine (Caja Overhaul), its children stubbed so the
 * branches pinned are the orchestrator's own: no turno opens one; an open
 * turno shows the active view until its «cerrar» flips the close section; a
 * turno carrying a blind count goes straight to the close, killed app or
 * not; deposit/withdraw open the movimiento sheet; and the Operativo tool
 * grid renders only when both items and a navigator arrive.
 */

const visto: Record<string, unknown> = {};
const activo: {
  onCerrar?: () => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
} = {};
const cerrarModal: { onSubmit?: (m: bigint, r: unknown, e: unknown) => void } = {};
const movimiento: { tipo?: string } = {};

vi.mock('../../src/screens/Caja/caja-open-turn-view', () => ({
  CajaOpenTurnView: () => {
    visto.abrir = true;
    return <p data-testid="caja-open-view" />;
  },
}));
vi.mock('../../src/screens/Caja/caja-active-turn', () => ({
  CajaActiveTurnView: (props: Record<string, unknown>) => {
    Object.assign(activo, props);
    visto.activo = true;
    return <p data-testid="caja-active-view" />;
  },
}));
vi.mock('../../src/screens/Caja/cerrar-caja-modal', () => ({
  CerrarCajaModal: (props: Record<string, unknown>) => {
    Object.assign(cerrarModal, props);
    return <p data-testid="caja-cerrar-modal" />;
  },
}));
vi.mock('../../src/screens/Caja/movimiento-sheet-wired', () => ({
  MovimientoSheetWired: (props: Record<string, unknown>) => {
    Object.assign(movimiento, props);
    return <p data-testid="caja-movimiento" />;
  },
}));
vi.mock('../../src/screens/Caja/tool-grid-section', () => ({
  ToolGridSection: () => {
    visto.tools = true;
    return <p data-testid="caja-tools" />;
  },
}));

const { CajaContent } = await import('../../src/screens/Caja/caja-content');

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const YO = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;

let turnos: InMemoryCajaTurnosRepository;

function montar(over: Record<string, unknown> = {}): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltura = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ cajaTurnos: turnos }}>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
  renderWithProviders(<CajaContent {...over} />, { wrapper: envoltura });
}

async function abrirTurno(over: Record<string, unknown> = {}) {
  return turnos.create({
    userId: YO,
    businessId: BIZ,
    fecha: '2026-09-28',
    aperturaAt: '2026-09-28T14:00:00.000Z',
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 0n,
    ...over,
  });
}

beforeEach(() => {
  turnos = new InMemoryCajaTurnosRepository(DEV);
  useAppConfigStore.getState().setCurrentBusinessId(BIZ);
  useAppConfigStore.getState().setUserId(YO);
});

afterEach(() => {
  useAppConfigStore.getState().reset();
});

describe('CajaContent · the state machine', () => {
  it('no turno: the open-turn view, and no tools without a navigator', async () => {
    montar();
    expect(await screen.findByTestId('caja-open-view')).toBeInTheDocument();
    expect(screen.queryByTestId('caja-active-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('caja-tools')).not.toBeInTheDocument();
  });

  it('an open turno shows the active view, and its buttons drive the close and the sheets', async () => {
    await abrirTurno();
    montar();
    expect(await screen.findByTestId('caja-active-view')).toBeInTheDocument();
    expect(screen.queryByTestId('caja-open-view')).not.toBeInTheDocument();

    act(() => activo.onDeposit?.());
    expect(await screen.findByTestId('caja-movimiento')).toBeInTheDocument();
    expect(movimiento.tipo).toBe('deposito');

    act(() => activo.onWithdraw?.());
    expect(movimiento.tipo).toBe('retiro');

    act(() => activo.onCerrar?.());
    expect(await screen.findByTestId('caja-cerrar-modal')).toBeInTheDocument();
  });

  it('a turno carrying a blind count goes straight to the close — killed app or not', async () => {
    const creado = await abrirTurno();
    await turnos.update(creado.id, {
      conteoCentavos: 480_00n,
      conteoAt: '2026-09-28T20:00:00.000Z',
    } as never);
    montar();
    expect(await screen.findByTestId('caja-cerrar-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('caja-active-view')).not.toBeInTheDocument();
  });

  it('the Operativo grid renders when items and a navigator both arrive, with the footer after', async () => {
    await abrirTurno();
    montar({
      toolItems: [{ key: 'x', label: 'X', path: '/x' }] as never,
      onNavigateTool: vi.fn(),
      footer: <p data-testid="caja-footer" />,
    });
    expect(await screen.findByTestId('caja-active-view')).toBeInTheDocument();
    expect(screen.getByTestId('caja-tools')).toBeInTheDocument();
    expect(screen.getByTestId('caja-footer')).toBeInTheDocument();
  });
});
