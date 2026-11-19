/**
 * `usePorEnviar` after a send (R3): a push that pulls nothing invalidates no
 * caja query, so the list kept rows already sent. The queue rows are keyed
 * on what a run changes (the unsent count, the last send), so they reread.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import type { BusinessId, UserId } from '@xangarro/domain';
import {
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  makeNewTicket,
  TEST_DEVICE_ID,
} from '@xangarro/testing';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { RepositoryProvider } from '../src/app/repository-provider';
import { initI18n } from '../src/i18n/index';
import { usePorEnviar } from '../src/screens/Pendientes/use-por-enviar';
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

let tickets: InMemoryTicketsRepository;

beforeEach(() => {
  tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER });
  sync.counts = { pending: 1, rejected: 0, retrying: 0, unsent: 1 };
  sync.lastSyncAt = null;
});

function montar() {
  const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const repos = buildTestRepos({ tickets, sales: new InMemorySalesRepository(TEST_DEVICE_ID) });
  return renderHook(() => usePorEnviar(), {
    wrapper: ({ children }: { children: ReactNode }): ReactElement => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={q}>
          <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    ),
  });
}

describe('usePorEnviar · después de enviar (R3)', () => {
  it('a send that empties the outbox empties the list', async () => {
    const t = await tickets.create(makeNewTicket({ businessId: BIZ, folio: 412, hora: '14:52' }));
    cola.mockResolvedValue([{ tableName: 'tickets', rowId: t.id, retrying: false }]);
    const { result, rerender } = montar();
    await waitFor(() => expect(result.current.cola).toHaveLength(1));
    cola.mockResolvedValue([]);
    sync.counts = { pending: 0, rejected: 0, retrying: 0, unsent: 0 };
    sync.lastSyncAt = '2026-11-19T14:55:00.000Z';
    rerender();
    await waitFor(() => expect(result.current.cola).toHaveLength(0));
    expect(result.current.fase).toBe('enviado');
  });

  it('nothing changed, nothing reread', async () => {
    cola.mockResolvedValue([]);
    const { result, rerender } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const lecturas = cola.mock.calls.length;
    rerender();
    expect(cola.mock.calls.length).toBe(lecturas);
  });
});
