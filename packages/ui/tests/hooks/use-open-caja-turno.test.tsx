/**
 * useOpenCajaTurno tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryCajaTurnosRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId, IsoDate, UserId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useOpenCajaTurno } from '../../src/hooks/use-open-caja-turno';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>
          {children}
        </MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useOpenCajaTurno', () => {
  let cajaTurnos: InMemoryCajaTurnosRepository;

  beforeEach(async () => {
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      userId: USER,
      hydrated: true,
    });
  });

  it('returns the open turno for the current user', async () => {
    await cajaTurnos.create({
      userId: USER,
      fecha: '2026-05-09' as IsoDate,
      aperturaAt: '2026-05-09T08:00:00.000Z',
      montoAperturaCentavos: 5000n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    const { result } = renderHook(() => useOpenCajaTurno(), {
      wrapper: wrapper({ cajaTurnos }),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.openTurno).not.toBeNull();
    expect(result.current.userId).toBe(USER);
  });

  it('returns null openTurno when no turn is open', async () => {
    const { result } = renderHook(() => useOpenCajaTurno(), {
      wrapper: wrapper({ cajaTurnos }),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.openTurno).toBeNull();
  });

  it('returns null userId when no user is logged in', () => {
    useAppConfigStore.setState({ userId: null });

    const { result } = renderHook(() => useOpenCajaTurno(), {
      wrapper: wrapper({ cajaTurnos }),
    });

    expect(result.current.userId).toBeNull();
  });
});
