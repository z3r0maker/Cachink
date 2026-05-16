/**
 * useCrearUsuario hook tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryUsersRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCrearUsuario } from '../../src/hooks/use-crear-usuario';
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

describe('useCrearUsuario', () => {
  let users: InMemoryUsersRepository;

  beforeEach(() => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    useAppConfigStore.setState({ currentBusinessId: BIZ, hydrated: true });
  });

  it('creates a user via the mutation', async () => {
    const { result } = renderHook(() => useCrearUsuario(), {
      wrapper: wrapper({ users }),
    });

    await act(async () => {
      result.current.mutate({
        nombre: 'María',
        pin: '123456',
        recoveryPassword: 'recovery123',
        role: 'operativo',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nombre).toBe('María');
    expect(result.current.data?.role).toBe('operativo');
    expect(result.current.data?.mustChangePin).toBe(true); // default
  });

  it('throws when no business is configured', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useCrearUsuario(), {
      wrapper: wrapper({ users }),
    });

    await act(async () => {
      result.current.mutate({
        nombre: 'X',
        pin: '000000',
        recoveryPassword: 'password',
        role: 'operativo',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('no current business');
  });
});
