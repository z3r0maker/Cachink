// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

/**
 * The linked register's queue flusher (O-06, DB2-DEV-02): the counts are
 * the queue as Registros por enviar lists it — every unsent record, plus the
 * ones already retrying — the flush reports the server's Retry-After back
 * for one retry, a count that cannot be read keeps the last one instead of
 * inventing a number, and coming back online flushes after a jittered wait
 * so a shop's registers do not reconnect in the same instant.
 */

const sync = vi.fn();
const colaPendiente = vi.fn();
let device: unknown = { deviceToken: 'tok' };

vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({ sync, colaPendiente }),
}));
vi.mock('../../src/operador/runtime/device-store', () => ({
  readDevice: () => device,
  writeDevice: vi.fn(),
}));

const { contarCola, useFlusher } = await import('../../src/operador/shell/cola-flusher');
import type { PendienteCrudo } from '@xangarro/caja/lectura';

const pendientes = (n: number, reintentando = 0): readonly PendienteCrudo[] =>
  Array.from({ length: n }, (_, i) =>
    i < reintentando ? ({ id: `p-${i}`, reintento: true } as never) : ({ id: `p-${i}` } as never),
  );

beforeEach(() => {
  vi.clearAllMocks();
  device = { deviceToken: 'tok' };
  sync.mockResolvedValue({});
  colaPendiente.mockResolvedValue([]);
});

afterEach(cleanup);

describe('contarCola', () => {
  it('every unsent record, and the ones already retrying', () => {
    assert.deepEqual(contarCola(pendientes(7, 2)), { pendientes: 7, reintentando: 2 });
    assert.deepEqual(contarCola([]), { pendientes: 0, reintentando: 0 });
  });
});

describe('useFlusher', () => {
  it('a linked caja starts from its real queue, never the fixture’s count', async () => {
    colaPendiente.mockResolvedValue(pendientes(5, 1));
    const { result } = renderHook(() => useFlusher(true));
    await waitFor(() => assert.ok(result.current.reales !== null));
    assert.deepEqual(result.current.reales, {
      pendientes: 5,
      reintentando: 1,
      rechazados: 0,
      reintento: null,
      enLinea: true,
    });
  });

  it('a flush reports the queue after the run, online', async () => {
    colaPendiente.mockResolvedValueOnce([]).mockResolvedValueOnce(pendientes(3));
    const { result } = renderHook(() => useFlusher(true));
    await waitFor(() => assert.ok(result.current.reales !== null));
    await act(async () => {
      await result.current.flush('captura', false);
    });
    assert.deepEqual(result.current.reales, {
      pendientes: 3,
      reintentando: 0,
      rechazados: 0,
      reintento: null,
      enLinea: true,
    });
    assert.equal(result.current.enviando, false);
  });

  it('the server’s Retry-After schedules one retry; a clean run clears it', async () => {
    colaPendiente.mockResolvedValue([]);
    sync.mockResolvedValueOnce({ retryAt: new Date(Date.now() + 1_500).toISOString() });
    const { result } = renderHook(() => useFlusher(true));
    await waitFor(() => assert.ok(result.current.reales !== null));
    await act(async () => {
      await result.current.flush('captura', false);
    });
    assert.equal(sync.mock.calls.length, 1);

    // Advance past the backoff: the retry fires by itself. The wait is
    // real time bounded by the backoff we set, so use a short one.
    sync.mockResolvedValue({});
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1_550));
    });
    assert.equal(sync.mock.calls.length, 2);
    assert.deepEqual(sync.mock.calls[1]?.[1], { mode: 'captura', manual: false });

    // A run with no retryAt clears the timer: nothing more fires.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    assert.equal(sync.mock.calls.length, 2);
  });

  it('a count that cannot be read keeps the last one — no invented number', async () => {
    colaPendiente.mockResolvedValueOnce(pendientes(4));
    const { result } = renderHook(() => useFlusher(true));
    await waitFor(() =>
      assert.deepEqual(result.current.reales, {
        pendientes: 4,
        reintentando: 0,
        rechazados: 0,
        reintento: null,
        enLinea: true,
      }),
    );

    colaPendiente.mockRejectedValue(new Error('worker ocupado'));
    await act(async () => {
      await result.current.flush('completa', true);
    });
    assert.deepEqual(result.current.reales, {
      pendientes: 4,
      reintentando: 0,
      rechazados: 0,
      reintento: null,
      enLinea: true,
    });
  });

  it('no device: the flush is a no-op', async () => {
    device = null;
    const { result } = renderHook(() => useFlusher(true));
    await act(async () => {
      await result.current.flush('captura', false);
    });
    assert.equal(sync.mock.calls.length, 0);
  });

  it('coming back online flushes completa after a jittered wait; offline only marks', async () => {
    colaPendiente.mockResolvedValue([]);
    const { result } = renderHook(() => useFlusher(true));
    await waitFor(() => assert.ok(result.current.reales !== null));

    act(() => {
      dispatchEvent(new Event('offline'));
    });
    assert.equal(result.current.reales?.enLinea, false);
    assert.equal(sync.mock.calls.length, 0, 'going offline flushes nothing');

    act(() => {
      dispatchEvent(new Event('online'));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3_200));
    });
    assert.equal(sync.mock.calls.length, 1);
    assert.deepEqual(sync.mock.calls[0]?.[1], { mode: 'completa', manual: true });
    assert.equal(result.current.reales?.enLinea, true);
  });
});
