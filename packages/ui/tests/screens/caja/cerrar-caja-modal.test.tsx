/**
 * CerrarCajaModal — the close flow works on the turno it is given.
 *
 * Regression (A-16, found on the iPad sim): the modal looked the turno up
 * through its own cached query, which nothing refreshed when a turno closed
 * or opened. Close → open → close then showed the previous turno's locked
 * count and skipped the blind count for the new one.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { BusinessId, CajaTurno, UserId } from '@xangarro/domain';
import { InMemoryCajaTurnosRepository } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { CerrarCajaModal } from '../../../src/screens/Caja/cerrar-caja-modal';
import { useAppConfigStore } from '../../../src/app-config/use-app-config';
import { initI18n } from '../../../src/i18n/index';
import { renderWithProviders, screen } from '../../test-utils';

initI18n();

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0USER1' as UserId;

async function turnos(repo: InMemoryCajaTurnosRepository): Promise<{
  closed: CajaTurno;
  open: CajaTurno;
}> {
  const base = { userId: USER, fecha: '2026-09-16', businessId: BIZ };
  const first = await repo.create({
    ...base,
    aperturaAt: '2026-09-16T09:00:00.000Z',
    montoAperturaCentavos: 50000n,
    efectivoAdicionalCentavos: 0n,
  });
  const closed = await repo.update(first.id, {
    conteoCentavos: 100n,
    conteoAt: '2026-09-16T12:00:00.000Z',
    cierreAt: '2026-09-16T12:00:00.000Z',
  });
  const open = await repo.create({
    ...base,
    aperturaAt: '2026-09-16T13:00:00.000Z',
    montoAperturaCentavos: 50000n,
    efectivoAdicionalCentavos: 0n,
  });
  return { closed, open };
}

function wrapper(client: QueryClient, repo: InMemoryCajaTurnosRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MockRepositoryProvider overrides={{ cajaTurnos: repo }}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    );
  };
}

describe('CerrarCajaModal', () => {
  afterEach(() => useAppConfigStore.getState().reset());

  it('asks for a blind count on a new turno even when the previous one was counted', async () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    const repo = new InMemoryCajaTurnosRepository();
    const { closed, open } = await turnos(repo);
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    // What the old cache held after the previous close.
    client.setQueryData(['cerrar-open-turno', BIZ], closed);
    const W = wrapper(client, repo);
    renderWithProviders(
      <W>
        <CerrarCajaModal turno={open} onSubmit={vi.fn()} submitting={false} />
      </W>,
    );
    expect(await screen.findByTestId('cerrar-caja-step-1')).toBeInTheDocument();
    expect(screen.queryByTestId('cerrar-caja-step-2')).toBeNull();
  });

  it('resumes at the result step when the given turno already has a count', async () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    const repo = new InMemoryCajaTurnosRepository();
    const { open } = await turnos(repo);
    const counted = await repo.update(open.id, {
      conteoCentavos: 40000n,
      conteoAt: '2026-09-16T18:00:00.000Z',
    });
    const W = wrapper(new QueryClient(), repo);
    renderWithProviders(
      <W>
        <CerrarCajaModal turno={counted} onSubmit={vi.fn()} submitting={false} />
      </W>,
    );
    expect(await screen.findByTestId('cerrar-caja-step-2')).toBeInTheDocument();
  });
});
