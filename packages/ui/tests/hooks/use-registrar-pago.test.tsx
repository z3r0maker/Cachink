/**
 * useRegistrarPago hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import {
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  makeNewClient,
  makeNewProduct,
} from '@xangarro/testing';
import type { BusinessId, IsoDate } from '@xangarro/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useRegistrarPago } from '../../src/hooks/use-registrar-pago';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useRegistrarPago', () => {
  let clientPayments: InMemoryClientPaymentsRepository;
  let clients: InMemoryClientsRepository;
  let products: InMemoryProductsRepository;
  let clienteId: ClientId;

  beforeEach(async () => {
    clientPayments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    clienteId = (await clients.create(makeNewClient({ businessId: BIZ }))).id;
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('registers a client payment via the mutation', async () => {
    await products.create(makeNewProduct({ businessId: BIZ }));

    const { result } = renderHook(() => useRegistrarPago(), {
      wrapper: wrapper({ clientPayments, clients }),
    });

    await act(async () => {
      result.current.mutate({
        clienteId,
        fecha: '2026-05-09' as IsoDate,
        montoCentavos: 5000n,
        metodo: 'Efectivo',
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.montoCentavos).toBe(5000n);
  });
});
