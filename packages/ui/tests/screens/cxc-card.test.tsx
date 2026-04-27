/**
 * CxCCard tests (P1C-M10-T03, S4-C4).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import { InMemoryClientsRepository, InMemorySalesRepository, makeNewSale } from '@cachink/testing';
import { CxCCard } from '../../src/screens/DirectorHome/cxc-card';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;

function renderCard(
  clients: InMemoryClientsRepository,
  sales: InMemorySalesRepository,
  onVer?: () => void,
): ReactElement {
  useAppConfigStore.getState().setCurrentBusinessId(BIZ);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ clients, sales }}>
        <CxCCard onVerTodo={onVer} />
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('CxCCard', () => {
  afterEach(() => useAppConfigStore.getState().reset());

  it('renders the empty state when no pending Crédito exists', async () => {
    const clients = new InMemoryClientsRepository(DEV);
    const sales = new InMemorySalesRepository(DEV);
    renderWithProviders(renderCard(clients, sales));
    await waitFor(() => {
      expect(screen.getByTestId('cxc-card')).toBeInTheDocument();
    });
  });

  it('renders rows + ver todo Btn when a credit venta is pending', async () => {
    const clients = new InMemoryClientsRepository(DEV);
    const sales = new InMemorySalesRepository(DEV);
    const cliente = await clients.create({
      nombre: 'Cliente Test',
      businessId: BIZ,
    });
    await sales.create(
      makeNewSale({
        fecha: '2026-04-15' as IsoDate,
        businessId: BIZ,
        metodo: 'Crédito',
        clienteId: cliente.id,
        estadoPago: 'pendiente',
        monto: 50_000n,
      }),
    );
    const onVer = vi.fn();
    renderWithProviders(renderCard(clients, sales, onVer));
    await waitFor(() => {
      expect(screen.getByTestId('cxc-card-ver-todo')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('cxc-card-ver-todo')[0]!);
    expect(onVer).toHaveBeenCalled();
  });
});
