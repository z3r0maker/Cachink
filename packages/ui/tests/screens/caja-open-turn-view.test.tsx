import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import type { BusinessId, DeviceId, UserId } from '@xangarro/domain';

import { InMemoryCajaTurnosRepository, InMemoryUsersRepository } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { CajaOpenTurnView } from '../../src/screens/Caja/caja-open-turn-view';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

initI18n();

/**
 * CajaOpenTurnView's three doors (QA #11's fix and the discrepancy guard):
 * a turno another user left open offers the handoff — their name, their
 * fondo, or the owner's own amount; nobody's open turno shows the abrir
 * modal with the last close as its suggestion; and the handoff banner
 * yields to the abrir modal when the owner opens differently.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const YO = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;

let turnos: InMemoryCajaTurnosRepository;
let users: InMemoryUsersRepository;

function montar(userId: UserId | null = YO): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  const envoltura = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ cajaTurnos: turnos, users }}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          {children}
        </TamaguiProvider>
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
  renderWithProviders(<CajaOpenTurnView userId={userId} />, { wrapper: envoltura });
}

beforeEach(() => {
  turnos = new InMemoryCajaTurnosRepository(DEV);
  users = new InMemoryUsersRepository(DEV);
  useAppConfigStore.getState().setCurrentBusinessId(BIZ);
});

afterEach(() => {
  useAppConfigStore.getState().reset();
  vi.restoreAllMocks();
});

describe('CajaOpenTurnView', () => {
  it('with no open turno, the abrir modal shows — and a closed turno is no handoff', async () => {
    const cierre = await turnos.create({
      userId: (
        await users.create({
          nombre: 'Pedro',
          pinHash: 'x',
          avatarColor: '#123456',
          businessId: BIZ,
        })
      ).id,
      businessId: BIZ,
      fecha: '2026-09-26',
      aperturaAt: '2026-09-26T14:00:00.000Z',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
    });
    await turnos.update(cierre.id, {
      cierreAt: '2026-09-26T21:00:00.000Z',
      montoCierreCentavos: 700_00n,
    });

    montar();
    expect(await screen.findByTestId('abrir-caja-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('caja-handoff-banner')).not.toBeInTheDocument();
  });

  it('a turno somebody else left open offers the handoff banner', async () => {
    const director = await users.create({
      nombre: 'Pedro el Director',
      pinHash: 'x',
      avatarColor: '#123456',
      businessId: BIZ,
    });
    await turnos.create({
      userId: director.id,
      businessId: BIZ,
      fecha: '2026-09-27',
      aperturaAt: '2026-09-27T14:00:00.000Z',
      montoAperturaCentavos: 800_00n,
      efectivoAdicionalCentavos: 0n,
    });

    montar();
    expect(await screen.findByTestId('caja-handoff-banner')).toBeInTheDocument();
    expect(screen.queryByTestId('abrir-caja-modal')).not.toBeInTheDocument();
  });

  it('choosing to open differently yields the banner to the abrir modal', async () => {
    const director = await users.create({
      nombre: 'Pedro el Director',
      pinHash: 'x',
      avatarColor: '#123456',
      businessId: BIZ,
    });
    await turnos.create({
      userId: director.id,
      businessId: BIZ,
      fecha: '2026-09-27',
      aperturaAt: '2026-09-27T14:00:00.000Z',
      montoAperturaCentavos: 800_00n,
      efectivoAdicionalCentavos: 0n,
    });

    montar();
    expect(await screen.findByTestId('caja-handoff-banner')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('caja-handoff-different'));
    expect(await screen.findByTestId('abrir-caja-modal')).toBeInTheDocument();
  });
});
