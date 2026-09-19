/**
 * useClienteDetail hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import {
  InMemoryClientsRepository,
  InMemoryClientPaymentsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  TEST_DEVICE_ID,
  makeNewClient,
  makeNewProduct,
  makeNewSale,
  makeNewTicket,
} from '@xangarro/testing';
import type { BusinessId, ClientId } from '@xangarro/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useClienteDetail } from '../../src/hooks/use-cliente-detail';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useClienteDetail', () => {
  let clients: InMemoryClientsRepository;
  let tickets: InMemoryTicketsRepository;
  let sales: InMemorySalesRepository;
  let clientPayments: InMemoryClientPaymentsRepository;
  let products: InMemoryProductsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    clientPayments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns client detail with pending sales', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ }));
    const client = await clients.create(makeNewClient({ businessId: BIZ, nombre: 'Laura' }));
    const ticket = await tickets.create(
      makeNewTicket({
        businessId: BIZ,
        metodo: 'Crédito',
        clienteId: client.id,
        estadoPago: 'pendiente',
      }),
    );
    await sales.create(
      makeNewSale({
        businessId: BIZ,
        productoId: product.id,
        monto: 5000n,
        ticketId: ticket.id,
      }),
    );

    const { result } = renderHook(() => useClienteDetail(client.id), {
      wrapper: wrapper({ clients, tickets, sales, clientPayments }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.cliente.nombre).toBe('Laura');
    expect(result.current.data?.pendingTickets).toHaveLength(1);
    expect(result.current.data?.saldoPendiente).toBe(5000n);
  });

  it('returns null for non-existent client', async () => {
    const { result } = renderHook(
      () => useClienteDetail('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ClientId),
      { wrapper: wrapper({ clients, tickets, sales, clientPayments }) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('is disabled when id is null', () => {
    const { result } = renderHook(() => useClienteDetail(null), {
      wrapper: wrapper({ clients, tickets, sales, clientPayments }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
