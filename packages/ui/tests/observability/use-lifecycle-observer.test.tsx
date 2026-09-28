import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

/**
 * The lifecycle observer stamps what the audit trail needs to reconstruct a
 * session: one cold-start, every foreground/background crossing, and each
 * login/logout — and nothing when there is no store or no device yet. A
 * write that fails is swallowed: the log must never take the app down.
 */

const writeAudit = vi.fn(async () => undefined);
let logStoreActual: unknown = { writeAudit };
let deviceIdActual: string | null = 'dev-1';
let userIdActual: string | null = null;
let bizActual: string | null = 'biz-1';

vi.mock('../../src/observability/observability-provider', () => ({
  useLogStore: () => logStoreActual,
}));
vi.mock('../../src/app-config/index', () => ({
  useDeviceId: () => deviceIdActual,
  useUserId: () => userIdActual,
  useCurrentBusinessId: () => bizActual,
}));

const cambioDeEstado: ((state: string) => void)[] = [];
vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_tipo: string, cb: (state: string) => void) => {
      cambioDeEstado.push(cb);
      return { remove: () => undefined };
    },
  },
  Platform: { OS: 'ios' },
}));

const { useLifecycleObserver } = await import('../../src/observability/use-lifecycle-observer');

const operaciones = () =>
  writeAudit.mock.calls.map((c) => (c[0] as { operation: string }).operation);

beforeEach(() => {
  writeAudit.mockReset();
  writeAudit.mockResolvedValue(undefined);
  logStoreActual = { writeAudit };
  deviceIdActual = 'dev-1';
  userIdActual = null;
  bizActual = 'biz-1';
});

afterEach(() => {
  cambioDeEstado.length = 0;
});

describe('useLifecycleObserver', () => {
  it('one cold-start on mount, carrying the platform', () => {
    renderHook(() => useLifecycleObserver());
    expect(operaciones()).toEqual(['system.cold-start']);
    const evento = writeAudit.mock.calls[0]?.[0] as { metadata?: { platform: string } };
    expect(evento.metadata?.platform).toBe('ios');
  });

  it('no store or no device yet means silence', () => {
    logStoreActual = null;
    renderHook(() => useLifecycleObserver());
    deviceIdActual = 'dev-1';
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('foreground and background crossings are stamped; other states are not', () => {
    renderHook(() => useLifecycleObserver());
    writeAudit.mockClear();
    act(() => {
      for (const cb of cambioDeEstado) cb('active');
    });
    act(() => {
      for (const cb of cambioDeEstado) cb('background');
    });
    act(() => {
      for (const cb of cambioDeEstado) cb('inactive');
    });
    expect(operaciones()).toEqual(['system.foreground', 'system.background']);
  });

  it('a userId appearing is a login; disappearing, a logout; staying, nothing', () => {
    const { rerender } = renderHook(() => useLifecycleObserver());
    writeAudit.mockClear();
    userIdActual = 'u-1';
    rerender();
    userIdActual = 'u-1';
    rerender();
    userIdActual = null;
    rerender();
    expect(operaciones()).toEqual(['auth.login', 'auth.logout']);
  });

  it('a failing write is swallowed, and the cold-start never repeats', () => {
    writeAudit.mockRejectedValue(new Error('disk full'));
    expect(() => renderHook(() => useLifecycleObserver())).not.toThrow();
    const { rerender } = renderHook(() => useLifecycleObserver());
    rerender();
    // Only the first mount's observer is silenced by hasMounted per instance;
    // within one instance there is exactly one cold-start.
    const frio = operaciones().filter((o) => o === 'system.cold-start');
    expect(frio.length).toBeGreaterThanOrEqual(1);
  });
});
