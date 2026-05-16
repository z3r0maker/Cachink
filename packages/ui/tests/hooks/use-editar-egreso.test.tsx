/**
 * useEditarEgreso hook tests.
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
import type { BusinessId, ExpenseId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEditarEgreso } from '../../src/hooks/use-editar-egreso';
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

describe('useEditarEgreso', () => {
  let expenses: InMemoryExpensesRepository;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('updates an expense via the mutation', async () => {
    const expense = await expenses.create(
      makeNewExpense({ businessId: BIZ, concepto: 'Original' }),
    );

    const { result } = renderHook(() => useEditarEgreso(), {
      wrapper: wrapper({ expenses }),
    });

    await act(async () => {
      result.current.mutate({ id: expense.id, patch: { concepto: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.concepto).toBe('Updated');
  });

  it('returns error when expense does not exist', async () => {
    const { result } = renderHook(() => useEditarEgreso(), {
      wrapper: wrapper({ expenses }),
    });

    await act(async () => {
      result.current.mutate({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ExpenseId,
        patch: { concepto: 'Nope' },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
