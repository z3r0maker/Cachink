/**
 * useCrearGastoRecurrente hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryRecurringExpensesRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCrearGastoRecurrente } from '../../src/hooks/use-crear-gasto-recurrente';
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

describe('useCrearGastoRecurrente', () => {
  let recurringExpenses: InMemoryRecurringExpensesRepository;

  beforeEach(() => {
    recurringExpenses = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('creates a recurring expense template', async () => {
    const { result } = renderHook(() => useCrearGastoRecurrente(), {
      wrapper: wrapper({ recurringExpenses }),
    });

    await act(async () => {
      result.current.mutate({
        concepto: 'Renta mensual',
        categoria: 'Renta',
        montoCentavos: 1_200_000n,
        frecuencia: 'mensual',
        diaDelMes: 1,
        proximoDisparo: '2026-06-01' as IsoDate,
        activo: true,
        businessId: BIZ,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.concepto).toBe('Renta mensual');
    expect(result.current.data?.frecuencia).toBe('mensual');
  });
});
