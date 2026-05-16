/**
 * useEgresosByDate hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryExpensesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
} from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEgresosByDate } from '../../src/hooks/use-egresos-by-date';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DATE = '2026-05-09' as IsoDate;

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

describe('useEgresosByDate', () => {
  let expenses: InMemoryExpensesRepository;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns expenses for the given date', async () => {
    await expenses.create(makeNewExpense({ businessId: BIZ, fecha: DATE }));
    await expenses.create(makeNewExpense({ businessId: BIZ, fecha: '2026-05-10' as IsoDate }));

    const { result } = renderHook(() => useEgresosByDate(DATE), {
      wrapper: wrapper({ expenses }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.fecha).toBe(DATE);
  });

  it('returns empty array when no expenses exist', async () => {
    const { result } = renderHook(() => useEgresosByDate(DATE), {
      wrapper: wrapper({ expenses }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useEgresosByDate(DATE), {
      wrapper: wrapper({ expenses }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
