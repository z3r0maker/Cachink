/**
 * useAbrirCaja hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryCajaTurnosRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId, UserId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useAbrirCaja } from '../../src/hooks/use-abrir-caja';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

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

describe('useAbrirCaja', () => {
  let cajaTurnos: InMemoryCajaTurnosRepository;

  beforeEach(() => {
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('opens a caja turn via the mutation', async () => {
    const { result } = renderHook(() => useAbrirCaja(), {
      wrapper: wrapper({ cajaTurnos }),
    });

    await act(async () => {
      result.current.mutate({ userId: USER, montoAperturaCentavos: 5000n });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.montoAperturaCentavos).toBe(5000n);
    expect(result.current.data?.cierreAt).toBeNull();
  });

  it('throws when no business is configured', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useAbrirCaja(), {
      wrapper: wrapper({ cajaTurnos }),
    });

    await act(async () => {
      result.current.mutate({ userId: USER, montoAperturaCentavos: 5000n });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('no current business');
  });

  it('defaults efectivoAdicional to 0n', async () => {
    const { result } = renderHook(() => useAbrirCaja(), {
      wrapper: wrapper({ cajaTurnos }),
    });

    await act(async () => {
      result.current.mutate({ userId: USER, montoAperturaCentavos: 3000n });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.efectivoAdicionalCentavos).toBe(0n);
  });
});
