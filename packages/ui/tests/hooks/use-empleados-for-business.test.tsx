/**
 * useEmpleadosForBusiness hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryEmployeesRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEmpleadosForBusiness } from '../../src/hooks/use-empleados-for-business';
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

describe('useEmpleadosForBusiness', () => {
  let employees: InMemoryEmployeesRepository;

  beforeEach(() => {
    employees = new InMemoryEmployeesRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('returns employees for the business', async () => {
    await employees.create({
      nombre: 'María',
      puesto: 'Cajera',
      salarioCentavos: 3_500_000n,
      periodo: 'quincenal',
      businessId: BIZ,
    });

    const { result } = renderHook(() => useEmpleadosForBusiness(), {
      wrapper: wrapper({ employees }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]!.nombre).toBe('María');
  });

  it('is disabled when businessId is null', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useEmpleadosForBusiness(), {
      wrapper: wrapper({ employees }),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
