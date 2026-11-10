/**
 * useQuickSwitchAuth (A-05): only active operators are listed, a right PIN
 * signs in, and five wrong PINs lock PIN entry — persisted, so a new hook
 * instance (an app restart) is still locked.
 */

import type { ReactNode } from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import assert from 'node:assert/strict';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hashSync } from 'bcryptjs';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { InMemoryAppConfigRepository, InMemoryUsersRepository } from '@xangarro/testing';
import type { BusinessId, User } from '@xangarro/domain';
import { APP_CONFIG_KEYS } from '../../src/app-config/index';
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

  const RIGHT = '123456';
  const WRONG = '000000';

  /**
   * One NIP typed for `who` on a fresh hook (an app restart). Resolves the
   * error shown, or null once `who` is signed in.
   */
  async function typeNip(who: User, pin: string): Promise<string | null> {
    useAppConfigStore.setState({ userId: null });
    const { result } = renderHook(() => useQuickSwitchAuth(BIZ), {
      wrapper: wrapper({ users, appConfig }),
    });
    act(() => result.current.handleAuth(who.id, pin));
    const signedIn = (): boolean => useAppConfigStore.getState().userId === who.id;
    await waitFor(() => assert.ok(result.current.error !== null || signedIn()));
    return result.current.error;
  }

  const AN_HOUR_AGO = new Date(Date.now() - 3_600_000).toISOString();
  type Entry = { failures: number; lockedUntil: string | null; level: number };
  const seed = (by: Record<string, Entry>): Promise<void> =>
    appConfig.set(APP_CONFIG_KEYS.pinLockout, JSON.stringify({ v: 2, by }));
  const storedBy = async (): Promise<Record<string, Entry>> =>
    (
      JSON.parse((await appConfig.get(APP_CONFIG_KEYS.pinLockout)) ?? '{"by":{}}') as {
        by: Record<string, Entry>;
      }
    ).by;

  it('makes the next lockout in a row longer, restart or not (F-08)', async () => {
    await seed({ [toni.id]: { failures: 4, lockedUntil: AN_HOUR_AGO, level: 1 } });
    assert.equal(await typeNip(toni, WRONG), 'Demasiados intentos. Espera 1 min.');
  });

  it('reads what either older build stored as no lockouts', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const older = [
      `{"failures":4,"lockedUntil":"${future}"}`,
      `{"failures":4,"lockedUntil":"${future}","level":3}`,
    ];
    for (const raw of older) {
      await appConfig.set(APP_CONFIG_KEYS.pinLockout, raw);
      assert.match((await typeNip(toni, WRONG)) ?? '', /Ese NIP no es/);
      assert.deepEqual(await storedBy(), {
        [toni.id]: { failures: 1, lockedUntil: null, level: 0 },
      });
    }
  });

  it('shares its count with the misses a cancellation recorded against the same person', async () => {
    // What `cancelarConNip` leaves after three wrong NIPs for Toni on Ventas.
    await seed({ [toni.id]: { failures: 3, lockedUntil: null, level: 0 } });
    assert.match((await typeNip(toni, WRONG)) ?? '', /Ese NIP no es/);
    assert.equal(await typeNip(toni, WRONG), 'Demasiados intentos. Espera 30 s.');
  });

  it('a coworker’s own sign-in does not reset the guesses at someone else’s NIP', async () => {
    const beto = await operator(users, 'Beto');
    for (let i = 0; i < 4; i += 1)
      assert.match((await typeNip(beto, WRONG)) ?? '', /Ese NIP no es/);
    assert.equal(await typeNip(toni, RIGHT), null, 'Toni signs in as himself');
    assert.equal(await typeNip(beto, WRONG), 'Demasiados intentos. Espera 30 s.');
    assert.match((await typeNip(beto, RIGHT)) ?? '', /Demasiados intentos/);
    assert.equal(await typeNip(toni, RIGHT), null, 'and Toni is not locked with Beto');
  });

  it('clears only the subject’s own count, with their own right NIP', async () => {
    const beto = await operator(users, 'Beto');
    await seed({
      [toni.id]: { failures: 2, lockedUntil: AN_HOUR_AGO, level: 3 },
      [beto.id]: { failures: 1, lockedUntil: null, level: 0 },
    });
    await typeNip(toni, WRONG);
    assert.deepEqual((await storedBy())[toni.id], {
      failures: 3,
      lockedUntil: AN_HOUR_AGO,
      level: 3,
    });
    assert.equal(await typeNip(toni, RIGHT), null);
    assert.deepEqual(await storedBy(), { [beto.id]: { failures: 1, lockedUntil: null, level: 0 } });
  });
});
