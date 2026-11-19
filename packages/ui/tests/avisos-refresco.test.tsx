/**
 * `useAvisos` after a send: a push that pulls nothing invalidates no caja
 * query, so Avisos (and the bell, which counts it) kept «1 registro sigue sin
 * enviarse» while the pill said «Enviado». The read is keyed on what a run
 * changes (the unsent count, the last send), as the queue's is since R3, and
 * the phone's queue lives in «esta caja», not a browser.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import type { BusinessId, UserId } from '@xangarro/domain';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { RepositoryProvider } from '../src/app/repository-provider';
import { initI18n } from '../src/i18n/index';
import { useAvisos } from '../src/screens/Avisos/use-avisos';
import { tamaguiConfig } from '../src/tamagui.config';
import { buildTestRepos } from './build-test-repos';

initI18n();

const cola = vi.fn(async (): Promise<readonly unknown[]> => []);
vi.mock('@xangarro/sync', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  unsentRows: () => cola(),
}));
vi.mock('../src/database/index', () => ({ useDatabase: () => ({}) }));

/** The bridge's state as the test sets it; the hook reads it on each render. */
const sync = {
  phase: 'idle' as const,
  counts: { pending: 1, rejected: 0, retrying: 0, unsent: 1 },
  lastSyncAt: null as string | null,
};
vi.mock('../src/app/cloud-sync-bridge', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCloudSync: () => ({
    state: { ...sync, reintento: null },
    syncNow: () => undefined,
    listRejected: async () => [],
    requeue: async () => undefined,
  }),
}));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;
const UNA = [{ tableName: 'expenses', rowId: 'g-1', retrying: false }];

beforeEach(() => {
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER });
  cola.mockReset();
  sync.counts = { pending: 1, rejected: 0, retrying: 0, unsent: 1 };
  sync.lastSyncAt = null;
});

function montar() {
  const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useAvisos(), {
    wrapper: ({ children }: { children: ReactNode }): ReactElement => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={q}>
          <RepositoryProvider repositories={buildTestRepos({})}>{children}</RepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    ),
  });
}

const titulos = (r: { current: ReturnType<typeof useAvisos> }) =>
  r.current.data?.avisos.map((a) => a.titulo) ?? [];

describe('useAvisos · después de enviar', () => {
  it('a send that empties the outbox takes the queue notice away', async () => {
    cola.mockResolvedValue(UNA);
    const { result, rerender } = montar();
    await waitFor(() => expect(titulos(result)).toContain('1 registro sigue sin enviarse'));
    cola.mockResolvedValue([]);
    sync.counts = { pending: 0, rejected: 0, retrying: 0, unsent: 0 };
    sync.lastSyncAt = '2026-11-19T15:51:00.000Z';
    rerender();
    await waitFor(() => expect(titulos(result)).toEqual([]));
  });

  it('keeps showing the last read while the new one comes', async () => {
    cola.mockResolvedValue(UNA);
    const { result, rerender } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    cola.mockReturnValue(new Promise(() => undefined));
    sync.lastSyncAt = '2026-11-19T15:51:00.000Z';
    rerender();
    expect(result.current.state).toBe('happy');
    expect(titulos(result)).toContain('1 registro sigue sin enviarse');
  });

  it('the phone says its queue lives in this caja', async () => {
    cola.mockResolvedValue(UNA);
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    expect(result.current.data?.avisos[0]?.cuerpo).toMatch(/^Viven en esta caja/);
  });
});
