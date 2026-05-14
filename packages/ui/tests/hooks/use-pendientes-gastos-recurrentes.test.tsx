/**
 * usePendientesGastosRecurrentes hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryRecurringExpensesRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { usePendientesGastosRecurrentes } from '../../src/hooks/use-pendientes-gastos-recurrentes';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('usePendientesGastosRecurrentes', () => {
  let recurringExpenses: InMemoryRecurringExpensesRepository;

  beforeEach(() => {
    recurringExpenses = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns due recurring expenses for today', async () => {
    await recurringExpenses.create({
      concepto: 'Renta',
      categoria: 'Renta',
      montoCentavos: 1_200_000n,
      frecuencia: 'mensual',
      diaDelMes: 10,
      proximoDisparo: '2026-05-10' as IsoDate,
      activo: true,
      businessId: BIZ,
    });

    const { result } = renderHook(() => usePendientesGastosRecurrentes('2026-05-10' as IsoDate), {
      wrapper: wrapper({ recurringExpenses }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('returns empty when nothing is due', async () => {
    await recurringExpenses.create({
      concepto: 'Renta',
      categoria: 'Renta',
      montoCentavos: 1_200_000n,
      frecuencia: 'mensual',
      diaDelMes: 15,
      proximoDisparo: '2026-05-15' as IsoDate,
      activo: true,
      businessId: BIZ,
    });

    const { result } = renderHook(() => usePendientesGastosRecurrentes('2026-05-10' as IsoDate), {
      wrapper: wrapper({ recurringExpenses }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});
