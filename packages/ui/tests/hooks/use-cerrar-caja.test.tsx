/**
 * useCerrarCaja hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryCajaTurnosRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId, CajaTurnoId, UserId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCerrarCaja } from '../../src/hooks/use-cerrar-caja';
import { AbrirCajaUseCase } from '@cachink/application';
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

describe('useCerrarCaja', () => {
  let cajaTurnos: InMemoryCajaTurnosRepository;
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;

  beforeEach(() => {
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  async function openTurn(): Promise<CajaTurnoId> {
    const uc = new AbrirCajaUseCase(cajaTurnos);
    const turno = await uc.execute({
      userId: USER,
      fecha: '2026-05-10',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    return turno.id;
  }

  it('closes an open caja turn via the mutation', async () => {
    const turnoId = await openTurn();
    const { result } = renderHook(() => useCerrarCaja(), {
      wrapper: wrapper({ cajaTurnos, sales, expenses }),
    });

    await act(async () => {
      result.current.mutate({
        turnoId,
        montoCierreCentavos: 5000n,
        discrepancyReason: null,
        explicacion: null,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.cierreAt).not.toBeNull();
    expect(result.current.data?.diferenciaCentavos).toBe(0n);
  });

  it('throws when no business is configured', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useCerrarCaja(), {
      wrapper: wrapper({ cajaTurnos, sales, expenses }),
    });

    await act(async () => {
      result.current.mutate({
        turnoId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as CajaTurnoId,
        montoCierreCentavos: 5000n,
        discrepancyReason: null,
        explicacion: null,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('no current business');
  });
});
