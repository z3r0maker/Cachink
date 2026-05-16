/**
 * useEditarCliente hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryClientsRepository, TEST_DEVICE_ID, makeNewClient } from '@cachink/testing';
import type { BusinessId, ClientId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEditarCliente } from '../../src/hooks/use-editar-cliente';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } } });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useEditarCliente', () => {
  let clients: InMemoryClientsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('updates a client via the mutation', async () => {
    const client = await clients.create(makeNewClient({ businessId: BIZ, nombre: 'Laura' }));

    const { result } = renderHook(() => useEditarCliente(), {
      wrapper: wrapper({ clients }),
    });

    await act(async () => {
      result.current.mutate({ id: client.id, patch: { nombre: 'Laura Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Laura Updated');
  });

  it('returns null when client does not exist', async () => {
    const { result } = renderHook(() => useEditarCliente(), {
      wrapper: wrapper({ clients }),
    });

    await act(async () => {
      result.current.mutate({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ClientId,
        patch: { nombre: 'Nope' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
