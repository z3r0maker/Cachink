/**
 * useProcesarGastoRecurrente hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useProcesarGastoRecurrente } from '../../src/hooks/use-procesar-gasto-recurrente';
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

describe('useProcesarGastoRecurrente', () => {
  let expenses: InMemoryExpensesRepository;
  let recurringExpenses: InMemoryRecurringExpensesRepository;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    recurringExpenses = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('processes a pending recurring expense and creates an egreso', async () => {
    const template = await recurringExpenses.create({
      concepto: 'Renta',
      categoria: 'Renta',
      montoCentavos: 1_200_000n,
      frecuencia: 'mensual',
      diaDelMes: 1,
      proximoDisparo: '2026-05-01' as IsoDate,
      activo: true,
      businessId: BIZ,
    });

    const { result } = renderHook(() => useProcesarGastoRecurrente(), {
      wrapper: wrapper({ expenses, recurringExpenses }),
    });

    await act(async () => {
      result.current.mutate({
        template,
        today: '2026-05-01' as IsoDate,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.egreso).not.toBeNull();
    expect(result.current.data?.egreso?.concepto).toBe('Renta');
  });
});
