/**
 * useQuickSwitchAuth (A-05): only active operators are listed, a right PIN
 * signs in, and five wrong PINs lock PIN entry — persisted, so a new hook
 * instance (an app restart) is still locked.
 */

import type { ReactNode } from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hashSync } from 'bcryptjs';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { InMemoryAppConfigRepository, InMemoryUsersRepository } from '@xangarro/testing';
import type { BusinessId, User } from '@xangarro/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useQuickSwitchAuth } from '../../src/app/use-quick-switch-auth';
import { initI18n } from '../../src/i18n/index';

initI18n();

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    );
  };
}

async function operator(users: InMemoryUsersRepository, nombre: string): Promise<User> {
  return users.create({
    nombre,
    pinHash: hashSync('123456', 4),
    avatarColor: 'blue',
    businessId: BIZ,
  });
}

describe('useQuickSwitchAuth', () => {
  let users: InMemoryUsersRepository;
  let appConfig: InMemoryAppConfigRepository;
  let toni: User;

  beforeEach(async () => {
    users = new InMemoryUsersRepository();
    appConfig = new InMemoryAppConfigRepository();
    toni = await operator(users, 'Toni');
    const ana = await operator(users, 'Ana');
    await users.update(ana.id, { active: false });
    useAppConfigStore.setState({ hydrated: true, currentBusinessId: BIZ, userId: null });
  });

  it('lists only active operators', async () => {
    const { result } = renderHook(() => useQuickSwitchAuth(BIZ), {
      wrapper: wrapper({ users, appConfig }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users.map((u) => u.nombre)).toEqual(['Toni']);
  });

  it('signs in with the right PIN', async () => {
    const { result } = renderHook(() => useQuickSwitchAuth(BIZ), {
      wrapper: wrapper({ users, appConfig }),
    });
    act(() => result.current.handleAuth(toni.id, '123456'));
    await waitFor(() => expect(useAppConfigStore.getState().userId).toBe(toni.id));
  });

  it('locks PIN entry after five wrong PINs, even for a fresh hook instance', async () => {
    const hook = () => useQuickSwitchAuth(BIZ);
    const first = renderHook(hook, { wrapper: wrapper({ users, appConfig }) });
    for (let i = 1; i <= 5; i += 1) {
      act(() => first.result.current.handleAuth(toni.id, '000000'));
      await waitFor(() => expect(first.result.current.submitting).toBe(false));
      await waitFor(() => expect(first.result.current.error).not.toBeNull());
    }
    expect(first.result.current.error).toMatch(/Demasiados intentos/);
    const second = renderHook(hook, { wrapper: wrapper({ users, appConfig }) });
    act(() => second.result.current.handleAuth(toni.id, '123456'));
    await waitFor(() => expect(second.result.current.error).toMatch(/Demasiados intentos/));
    expect(useAppConfigStore.getState().userId).toBeNull();
  });
});
