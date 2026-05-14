/**
 * useRegistrarEgreso hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryExpensesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useRegistrarEgreso } from '../../src/hooks/use-registrar-egreso';
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

describe('useRegistrarEgreso', () => {
  let expenses: InMemoryExpensesRepository;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('creates an expense via the mutation', async () => {
    const { result } = renderHook(() => useRegistrarEgreso(), {
      wrapper: wrapper({ expenses }),
    });

    await act(async () => {
      result.current.mutate(
        makeNewExpense({ businessId: BIZ, concepto: 'Renta' }),
      );
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.concepto).toBe('Renta');
    expect(result.current.data?.monto).toBe(1_200_000n);
  });

  it('propagates Zod validation errors', async () => {
    const { result } = renderHook(() => useRegistrarEgreso(), {
      wrapper: wrapper({ expenses }),
    });

    await act(async () => {
      result.current.mutate({
        fecha: 'invalid-date' as never,
        concepto: '',
        categoria: 'Renta',
        monto: 100n,
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
