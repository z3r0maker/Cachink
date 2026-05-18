/**
 * useOtherOpenTurno hook tests.
 *
 * Verifies:
 * 1. Returns null when no open turno exists
 * 2. Returns null when only open turno belongs to current user
 * 3. Returns the other user's turno + name when different user has open turno
 * 4. Returns otherUserName: null while user query is loading
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryCajaTurnosRepository,
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId, UserId } from '@cachink/domain';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useOtherOpenTurno } from '../../src/screens/Caja/use-other-open-turno';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_A = '01HZ8XQN9GZJXV8AKQ5XUSERA' as UserId;
const USER_B = '01HZ8XQN9GZJXV8AKQ5XUSERB' as UserId;

function wrapper(
  overrides?: Record<string, unknown>,
): (props: { children: ReactNode }) => ReactNode {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
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

describe('useOtherOpenTurno', () => {
  let cajaTurnos: InMemoryCajaTurnosRepository;
  let users: InMemoryUsersRepository;

  beforeEach(() => {
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      userId: USER_A,
      hydrated: true,
    });
  });

  it('returns null when no open turno exists for the business', async () => {
    const { result } = renderHook(() => useOtherOpenTurno(USER_A), {
      wrapper: wrapper({ cajaTurnos, users }),
    });

    await waitFor(() => {
      expect(result.current.otherTurno).toBeNull();
      expect(result.current.otherUserName).toBeNull();
    });
  });

  it('returns null when the only open turno belongs to the current user', async () => {
    await cajaTurnos.create({
      userId: USER_A,
      fecha: '2026-05-16',
      aperturaAt: '2026-05-16T08:00:00Z',
      montoAperturaCentavos: 100000n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    const { result } = renderHook(() => useOtherOpenTurno(USER_A), {
      wrapper: wrapper({ cajaTurnos, users }),
    });

    await waitFor(() => {
      expect(result.current.otherTurno).toBeNull();
      expect(result.current.otherUserName).toBeNull();
    });
  });

  it('returns the other user turno + name when a different user has an open turno', async () => {
    await users.create({
      nombre: 'Director Test',
      email: 'director@test.com',
      pinHash: 'hash123',
      recoveryPasswordHash: 'recHash',
      role: 'director',
      mustChangePin: false,
      avatarColor: 'blue',
      businessId: BIZ,
    });
    // Get the user ID that was just created
    const allUsers = await users.findAllByBusiness(BIZ);
    const directorUser = allUsers[0]!;

    await cajaTurnos.create({
      userId: directorUser.id,
      fecha: '2026-05-16',
      aperturaAt: '2026-05-16T08:00:00Z',
      montoAperturaCentavos: 150000n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    const { result } = renderHook(() => useOtherOpenTurno(USER_A), {
      wrapper: wrapper({ cajaTurnos, users }),
    });

    await waitFor(() => {
      expect(result.current.otherTurno).not.toBeNull();
      expect(result.current.otherTurno!.montoAperturaCentavos).toBe(150000n);
      expect(result.current.otherUserName).toBe('Director Test');
    });
  });

  it('returns otherUserName: null while the user query is loading', async () => {
    await cajaTurnos.create({
      userId: USER_B,
      fecha: '2026-05-16',
      aperturaAt: '2026-05-16T08:00:00Z',
      montoAperturaCentavos: 50000n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    const { result } = renderHook(() => useOtherOpenTurno(USER_A), {
      wrapper: wrapper({ cajaTurnos, users }),
    });

    // Initially, the turno may be found but user name is still loading
    // After queries settle, otherUserName is null because USER_B doesn't exist in users repo
    await waitFor(() => {
      expect(result.current.otherTurno).not.toBeNull();
    });
    // USER_B doesn't exist in users repo, so name remains null
    expect(result.current.otherUserName).toBeNull();
  });
});
