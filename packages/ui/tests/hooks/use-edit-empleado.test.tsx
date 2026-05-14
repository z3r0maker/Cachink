/**
 * useEditEmpleado hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryEmployeesRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEditEmpleado } from '../../src/hooks/use-edit-empleado';
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

describe('useEditEmpleado', () => {
  let employees: InMemoryEmployeesRepository;

  beforeEach(() => {
    employees = new InMemoryEmployeesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('updates an employee via the mutation', async () => {
    const emp = await employees.create({
      nombre: 'María',
      puesto: 'Cajera',
      salarioCentavos: 3_500_000n,
      periodo: 'quincenal',
      businessId: BIZ,
    });

    const { result } = renderHook(() => useEditEmpleado(), {
      wrapper: wrapper({ employees }),
    });

    await act(async () => {
      result.current.mutate({ id: emp.id, puesto: 'Gerente' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.puesto).toBe('Gerente');
  });
});
