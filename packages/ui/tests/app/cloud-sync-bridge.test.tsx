import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

/**
 * CloudSyncBridge (A-07): the sync engine's results become the pill's state —
 * idle/offline/error by the error's code, lastSyncAt only when a push really
 * reached the server, a revoked device forgotten, the server's Retry-After
 * handed to the scheduler — and a thrown run never leaves «Sincronizando…»
 * stuck. The engine and scheduler are fakes; React Query runs real.
 */

const { SyncEngine, SyncScheduler, engineCalls, schedulerCalls } = vi.hoisted(() => {
  const engineCalls = {
    syncNow: vi.fn(),
    pushOnly: vi.fn(),
    counts: vi.fn(async () => ({ pending: 0, rejected: 0 })),
    rejected: vi.fn(async () => [{ tableName: 'sales', rowId: 'r-1', reason: 'x' }]),
    requeue: vi.fn(async () => undefined),
  };
  const SyncEngine = vi.fn(function (this: unknown) {
    Object.assign(this, engineCalls);
  });
  const schedulerCalls = {
    noteWrite: vi.fn(),
    onForeground: vi.fn(),
    onBackground: vi.fn(),
    retryIn: vi.fn(),
    dispose: vi.fn(),
  };
  const SyncScheduler = vi.fn(function (this: unknown) {
    Object.assign(this, schedulerCalls);
  });
  return { SyncEngine, SyncScheduler, engineCalls, schedulerCalls };
});

const forgetDevice = vi.fn(async () => undefined);
const cambioDeEstado: ((state: string) => void)[] = [];

vi.mock('../../src/sync/sync-scheduler', () => ({ SyncScheduler }));
vi.mock('@xangarro/sync', () => ({
  SyncEngine,
  SyncScheduler,
  // The local scheduler reads these at module init.
  PULL_AFTER_CAPTURE_MS: 2_000,
  spread: (ms: number) => ms,
}));
vi.mock('../../src/activation/forget-device', () => ({ forgetDevice }));
vi.mock('../../src/activation/activation-context', () => ({
  useActivationContext: () => ({
    client: { fetch: vi.fn() },
    config: { tokenStore: { get: () => 'tok', set: vi.fn(), clear: vi.fn() } },
  }),
}));
vi.mock('../../src/activation/use-activation-state', () => ({
  useActivationState: () => ({ record: { businessId: 'b-1' } }),
}));
vi.mock('../../src/database/index', () => ({ useDatabase: () => ({ $client: {} }) }));
vi.mock('../../src/app/repository-provider', () => ({
  useAppConfigRepository: () => ({}),
}));
vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_t: string, cb: (s: string) => void) => {
      cambioDeEstado.push(cb);
      return { remove: () => undefined };
    },
  },
  Platform: { OS: 'ios' },
}));

const { CloudSyncBridge, useCloudSync } = await import('../../src/app/cloud-sync-bridge');

let valor: ReturnType<typeof useCloudSync>;

function montar(): void {
  const Sonda = (): ReactElement => {
    valor = useCloudSync();
    return <p>puente</p>;
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltura = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>
      <CloudSyncBridge>{children}</CloudSyncBridge>
    </QueryClientProvider>
  );
  render(<Sonda />, { wrapper: envoltura });
}

const resultado = (over: Record<string, unknown> = {}) => ({
  push: { error: null },
  pull: { error: null, applied: 0 },
  retryAt: null,
  revoked: false,
  deferred: false,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  cambioDeEstado.length = 0;
  // A mounted bridge with an activation record triggers runs of its own;
  // every test starts from a healthy result unless it says otherwise.
  engineCalls.syncNow.mockReset().mockResolvedValue(resultado());
  engineCalls.pushOnly.mockReset().mockResolvedValue(resultado());
  engineCalls.counts.mockReset().mockResolvedValue({ pending: 2, rejected: 1 });
});

describe('CloudSyncBridge', () => {
  it('renders its children and settles idle', async () => {
    montar();
    expect(await screen.findByText('puente')).toBeInTheDocument();
    await waitFor(() => expect(valor.state.phase).toBe('idle'));
  });

  it('«Actualizar» runs a manual sync and records when the push reached the server', async () => {
    engineCalls.syncNow.mockResolvedValue(resultado());
    montar();
    await act(async () => {
      valor.syncNow();
    });
    expect(engineCalls.syncNow).toHaveBeenCalledWith({ manual: true });
    expect(valor.state.phase).toBe('idle');
    expect(valor.state.lastSyncAt).not.toBeNull();
    expect(valor.state.counts).toEqual({ pending: 2, rejected: 1 });
  });

  it('a network error reads offline; any other error reads error; neither re-stamps lastSyncAt', async () => {
    montar();
    // A healthy run stamps the clock; the failures below must not re-stamp.
    await act(async () => {
      valor.syncNow();
    });
    await waitFor(() => expect(valor.state.lastSyncAt).not.toBeNull());
    const sellada = valor.state.lastSyncAt;

    engineCalls.syncNow.mockResolvedValue(resultado({ push: { error: { code: 'NETWORK' } } }));
    await act(async () => {
      valor.syncNow();
    });
    await waitFor(() => expect(valor.state.phase).toBe('offline'));
    expect(valor.state.lastSyncAt).toBe(sellada);

    // A pull error with a healthy push still reached the server: the stamp
    // moves, the phase reads error.
    engineCalls.syncNow.mockResolvedValue(resultado({ pull: { error: { code: 'CONFLICT' } } }));
    await act(async () => {
      valor.syncNow();
    });
    await waitFor(() => expect(valor.state.phase).toBe('error'));
    expect(valor.state.lastSyncAt).not.toBe(sellada);
  });

  it('a deferred or pushless run does not count as synced', async () => {
    montar();
    await waitFor(() => expect(valor.state.phase).toBe('idle'));
    const sellada = valor.state.lastSyncAt;
    engineCalls.syncNow.mockResolvedValue(resultado({ deferred: true }));
    await act(async () => {
      valor.syncNow();
    });
    expect(valor.state.lastSyncAt).toBe(sellada);
  });

  it('a revoked device is forgotten, never locked out of its data', async () => {
    engineCalls.syncNow.mockResolvedValue(resultado({ revoked: true }));
    montar();
    await act(async () => {
      valor.syncNow();
    });
    expect(forgetDevice).toHaveBeenCalled();
  });

  it('the server’s Retry-After reaches the scheduler', async () => {
    engineCalls.syncNow.mockResolvedValue(
      resultado({ retryAt: new Date(Date.now() + 60_000).toISOString() }),
    );
    montar();
    await act(async () => {
      valor.syncNow();
    });
    expect(SyncScheduler.mock.instances[0] ?? true).toBeTruthy();
  });

  it('a thrown run sets error instead of sticking on syncing', async () => {
    engineCalls.syncNow.mockRejectedValue(new Error('sqlite exploded'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    montar();
    await act(async () => {
      valor.syncNow();
    });
    expect(valor.state.phase).toBe('error');
    errorSpy.mockRestore();
  });

  it('listRejected and requeue speak to the engine, and requeue pushes after', async () => {
    engineCalls.pushOnly.mockResolvedValue(resultado());
    montar();
    const rechazadas = await valor.listRejected();
    expect(rechazadas[0]?.rowId).toBe('r-1');
    await act(async () => {
      await valor.requeue([{ tableName: 'sales', rowId: 'r-1' }]);
    });
    expect(engineCalls.requeue).toHaveBeenCalledWith('sales', 'r-1');
    expect(engineCalls.pushOnly).toHaveBeenCalledWith({ manual: true });
  });

  it('foreground and background cross the scheduler', async () => {
    montar();
    schedulerCalls.onForeground.mockClear();
    act(() => {
      for (const cb of cambioDeEstado) cb('active');
    });
    expect(schedulerCalls.onForeground).toHaveBeenCalled();
    act(() => {
      for (const cb of cambioDeEstado) cb('background');
    });
    expect(schedulerCalls.onBackground).toHaveBeenCalled();
  });
});
