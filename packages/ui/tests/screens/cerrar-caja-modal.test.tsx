import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import type { BusinessId, DeviceId } from '@xangarro/domain';

import { InMemoryCajaTurnosRepository } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';

import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';
import { act } from '@testing-library/react';

initI18n();

/**
 * CerrarCajaModal's orchestration (Caja Overhaul Phase C): the blind count
 * comes first and is persisted the moment it exists — killed app or not —
 * and only then does the comparison step appear, handing the close upward.
 * The two steps are stubbed; what is pinned is the order and the write.
 */

const ultimoBlind: { onSubmit?: (c: bigint) => Promise<void>; submitting?: boolean } = {};
const ultimoResult: {
  conteoCentavos?: bigint;
  esperadoCentavos?: bigint | null;
  onClose?: (reason: never, explicacion: never) => void;
} = {};

vi.mock('../../src/screens/Caja/blind-count-step', () => ({
  BlindCountStep: (props: {
    readonly onSubmit: (c: bigint) => Promise<void>;
    readonly submitting: boolean;
  }) => {
    ultimoBlind.onSubmit = props.onSubmit;
    ultimoBlind.submitting = props.submitting;
    return <p data-testid="cerrar-caja-step-1" />;
  },
}));
vi.mock('../../src/screens/Caja/count-result-step', () => ({
  CountResultStep: (props: {
    readonly conteoCentavos: bigint;
    readonly esperadoCentavos: bigint | null;
    readonly onClose: (reason: never, explicacion: never) => void;
  }) => {
    ultimoResult.conteoCentavos = props.conteoCentavos;
    ultimoResult.esperadoCentavos = props.esperadoCentavos;
    ultimoResult.onClose = props.onClose;
    return <p data-testid="cerrar-caja-step-2" />;
  },
}));

const { CerrarCajaModal } = await import('../../src/screens/Caja/cerrar-caja-modal');

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

let turnos: InMemoryCajaTurnosRepository;

function montar(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltura = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ cajaTurnos: turnos }}>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
  renderWithProviders(<CerrarCajaModal onSubmit={vi.fn()} submitting={false} />, {
    wrapper: envoltura,
  });
}

beforeEach(async () => {
  turnos = new InMemoryCajaTurnosRepository(DEV);
  useAppConfigStore.getState().setCurrentBusinessId(BIZ);
});

afterEach(() => {
  useAppConfigStore.getState().reset();
  vi.restoreAllMocks();
});

describe('CerrarCajaModal', () => {
  it('the blind count comes first, is persisted the moment it exists, and then the comparison appears', async () => {
    const creado = await turnos.create({
      userId: '01HZ8XQN9GZJXV8AKQ5X0C7ME0',
      businessId: BIZ,
      fecha: '2026-09-28',
      aperturaAt: '2026-09-28T14:00:00.000Z',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
    });

    montar();
    expect(await screen.findByTestId('cerrar-caja-step-1')).toBeInTheDocument();
    // Let the open-turno query resolve: a submit before it lands is a no-op.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      await ultimoBlind.onSubmit?.(520_00n);
    });
    expect(screen.getByTestId('cerrar-caja-step-2')).toBeInTheDocument();
    expect(ultimoResult.conteoCentavos).toBe(520_00n);

    // The count was written before the comparison could exist.
    const guardado = await turnos.findById(creado.id);
    expect((guardado as { conteoCentavos?: bigint }).conteoCentavos).toBe(520_00n);
    expect((guardado as { conteoAt?: string }).conteoAt).toBeTruthy();
  });

  it('a turno that already carries a count opens straight on the comparison', async () => {
    await turnos.create({
      userId: '01HZ8XQN9GZJXV8AKQ5X0C7ME0',
      businessId: BIZ,
      fecha: '2026-09-28',
      aperturaAt: '2026-09-28T14:00:00.000Z',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
    });
    const abierto = (await turnos.findLatest(BIZ))!;
    await turnos.update(abierto.id, {
      conteoCentavos: 480_00n,
      conteoAt: '2026-09-28T20:00:00.000Z',
    } as never);

    montar();
    expect(await screen.findByTestId('cerrar-caja-step-2')).toBeInTheDocument();
    expect(ultimoResult.conteoCentavos).toBe(480_00n);
    expect(screen.queryByTestId('cerrar-caja-step-1')).not.toBeInTheDocument();
  });

  it('closing from the comparison hands the count, reason and explanation upward', async () => {
    await turnos.create({
      userId: '01HZ8XQN9GZJXV8AKQ5X0C7ME0',
      businessId: BIZ,
      fecha: '2026-09-28',
      aperturaAt: '2026-09-28T14:00:00.000Z',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
    });
    const abierto = (await turnos.findLatest(BIZ))!;
    await turnos.update(abierto.id, {
      conteoCentavos: 480_00n,
      conteoAt: '2026-09-28T20:00:00.000Z',
    } as never);

    const onSubmit = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const envoltura = ({ children }: { children: ReactNode }): ReactElement => (
      <QueryClientProvider client={client}>
        <MockRepositoryProvider overrides={{ cajaTurnos: turnos }}>
          {children}
        </MockRepositoryProvider>
      </QueryClientProvider>
    );
    renderWithProviders(<CerrarCajaModal onSubmit={onSubmit} submitting={false} />, {
      wrapper: envoltura,
    });
    expect(await screen.findByTestId('cerrar-caja-step-2')).toBeInTheDocument();
    act(() => {
      ultimoResult.onClose?.('faltante' as never, 'se fue el camión' as never);
    });
    expect(onSubmit).toHaveBeenCalledWith(480_00n, 'faltante', 'se fue el camión');
  });
});
