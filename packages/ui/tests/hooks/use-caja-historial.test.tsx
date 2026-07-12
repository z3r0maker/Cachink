/**
 * useCajaHistorial tests — query wrapping CajaTurnosRepository.
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
import { useCajaHistorial } from '../../src/hooks/use-caja-historial';
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

describe('useCajaHistorial', () => {
  let cajaTurnos: InMemoryCajaTurnosRepository;

  beforeEach(async () => {
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns turns within the date range', async () => {
    await cajaTurnos.create({
      userId: USER,
      fecha: '2026-05-09' as IsoDate,
      aperturaAt: '2026-05-09T08:00:00.000Z',
      montoAperturaCentavos: 5000n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    const { result } = renderHook(
      () => useCajaHistorial('2026-05-01' as IsoDate, '2026-05-31' as IsoDate),
      { wrapper: wrapper({ cajaTurnos }) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('returns empty when no business is selected', () => {
    useAppConfigStore.setState({ currentBusinessId: null });

    const { result } = renderHook(
      () => useCajaHistorial('2026-05-01' as IsoDate, '2026-05-31' as IsoDate),
      { wrapper: wrapper({ cajaTurnos }) },
    );

    // Query should be disabled
    expect(result.current.fetchStatus).toBe('idle');
  });
});
