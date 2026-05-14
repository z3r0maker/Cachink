/**
 * useClientsForBusiness hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryClientsRepository,
  TEST_DEVICE_ID,
  makeNewClient,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useClientsForBusiness } from '../../src/hooks/use-clients-for-business';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(
  overrides?: Record<string, unknown>,
): (props: { children: ReactNode }) => ReactNode {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
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

describe('useClientsForBusiness', () => {
  let clients: InMemoryClientsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns all clients for the business', async () => {
    await clients.create(makeNewClient({ businessId: BIZ, nombre: 'Laura' }));
    await clients.create(makeNewClient({ businessId: BIZ, nombre: 'Pedro' }));

    const { result } = renderHook(() => useClientsForBusiness(), {
      wrapper: wrapper({ clients }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('returns empty when no clients exist', async () => {
    const { result } = renderHook(() => useClientsForBusiness(), {
      wrapper: wrapper({ clients }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useClientsForBusiness(), {
      wrapper: wrapper({ clients }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
