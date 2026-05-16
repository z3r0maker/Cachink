/**
 * useCrearCliente hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryClientsRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCrearCliente } from '../../src/hooks/use-crear-cliente';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(
  overrides?: Record<string, unknown>,
): (props: { children: ReactNode }) => ReactNode {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={qc}>
          <MockRepositoryProvider overrides={overrides}>
            {children}
          </MockRepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    );
  };
}

describe('useCrearCliente', () => {
  let clients: InMemoryClientsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('creates a client via the mutation', async () => {
    const { result } = renderHook(() => useCrearCliente(), {
      wrapper: wrapper({ clients }),
    });

    await act(async () => {
      result.current.mutate({
        nombre: 'Laura Hernández',
        telefono: '3312345678',
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Laura Hernández');
    expect(result.current.data?.telefono).toBe('3312345678');
  });

  it('creates a client without telefono', async () => {
    const { result } = renderHook(() => useCrearCliente(), {
      wrapper: wrapper({ clients }),
    });

    await act(async () => {
      result.current.mutate({
        nombre: 'Pedro Ortiz',
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('Pedro Ortiz');
  });
});
