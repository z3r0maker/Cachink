/**
 * `useCloudBridges` mode-gate test (Round 3 F2).
 *
 * Pre-Round 3, `useLazyCloudAuthHandle` fired `initCloudAuth({byo,
 * defaults})` whenever `byo || defaults` was non-null. `defaults` comes
 * from `EXPO_PUBLIC_CLOUD_API_URL` / `VITE_CLOUD_API_URL` env vars
 * baked into the build, so any build with those vars set triggered the
 * dynamic `@cachink/sync-cloud` import for **every** user — including
 * Local-standalone and LAN users who never picked Cloud mode. That
 * violated CLAUDE.md §7's "sync code only loaded when mode needs it"
 * contract.
 *
 * The fix passes the active `AppMode` into the hook and short-circuits
 * the effect when `mode !== 'cloud'`. This file tests that contract.
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing';
import type { CachinkDatabase } from '@cachink/data';
import { TestDatabaseProvider } from '../../src/database/_internal';
import { useAppConfigStore } from '../../src/app-config/index';
import type * as CloudBridgeModule from '../../src/sync/cloud-bridge';
import type { CloudAuthHandle, CloudBackendConfig } from '../../src/sync/cloud-bridge';

// Mock `initCloudAuth` so we can assert on (non)-invocation. Importing
// the real module would dynamic-import @cachink/sync-cloud which isn't
// available in the test env.
const mockInitCloudAuth = vi.fn(async (): Promise<CloudAuthHandle | null> => null);
vi.mock('../../src/sync/cloud-bridge', async () => {
  const actual = await vi.importActual<typeof CloudBridgeModule>('../../src/sync/cloud-bridge');
  return {
    ...actual,
    initCloudAuth: (args: unknown) => mockInitCloudAuth(args as never),
  };
});

// `useByoBackend` reads from the SQLite sync-state via TanStack Query.
// We don't care about its real behaviour for the F2 test — what matters
// is whether `initCloudAuth` fires under each mode. Stubbing it removes
// the DB dependency from this hook spec.
vi.mock('../../src/sync/use-byo-backend', () => ({
  useByoBackend: () => ({
    config: null,
    loading: false,
    save: vi.fn(),
    clear: vi.fn(),
  }),
}));

// Import after the mocks are registered.
import { useCloudBridges } from '../../src/sync/use-cloud-bridges';

const STUB_DEFAULTS: CloudBackendConfig = {
  projectUrl: 'https://stub.supabase.co',
  anonKey: 'stub-anon-key',
  powersyncUrl: null,
};

// `usePersistCloudSession` calls useDatabase() → we hand it a
// minimal stub. The hook only invokes the database when sign-in succeeds,
// which never happens in these tests (the mode-gate exits early).
const STUB_DB = {} as unknown as CachinkDatabase;

function makeWrapper(): (props: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={qc}>
        <TestDatabaseProvider database={STUB_DB}>
          <MockRepositoryProvider>{children}</MockRepositoryProvider>
        </TestDatabaseProvider>
      </QueryClientProvider>
    );
  };
}

function setMode(mode: 'local' | 'lan-server' | 'lan-client' | 'cloud' | null): void {
  act(() => {
    useAppConfigStore.setState({
      hydrated: true,
      mode,
      currentBusinessId: null,
      role: null,
      deviceId: null,
    });
  });
}

describe('useCloudBridges mode-gate (Round 3 F2)', () => {
  beforeEach(() => {
    mockInitCloudAuth.mockClear();
    setMode(null);
  });

  afterEach(() => {
    setMode(null);
  });

  it('does not call initCloudAuth when mode is null (first-run, wizard not yet completed)', async () => {
    const wrapper = makeWrapper();
    setMode(null);
    renderHook(() => useCloudBridges({ defaults: STUB_DEFAULTS }), { wrapper });
    // Effect runs sync after mount; allow microtasks to drain.
    await new Promise((r) => setTimeout(r, 0));
    expect(mockInitCloudAuth).not.toHaveBeenCalled();
  });

  it('does not call initCloudAuth when mode === local-standalone (the F2 leak case)', async () => {
    const wrapper = makeWrapper();
    setMode('local');
    renderHook(() => useCloudBridges({ defaults: STUB_DEFAULTS }), { wrapper });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockInitCloudAuth).not.toHaveBeenCalled();
  });

  it('does not call initCloudAuth when mode === tablet-only', async () => {
    const wrapper = makeWrapper();
    setMode('local');
    renderHook(() => useCloudBridges({ defaults: STUB_DEFAULTS }), { wrapper });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockInitCloudAuth).not.toHaveBeenCalled();
  });

  it('does not call initCloudAuth when mode === lan', async () => {
    const wrapper = makeWrapper();
    setMode('lan-client');
    renderHook(() => useCloudBridges({ defaults: STUB_DEFAULTS }), { wrapper });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockInitCloudAuth).not.toHaveBeenCalled();
  });

  it('DOES call initCloudAuth when mode === cloud and defaults are configured', async () => {
    const wrapper = makeWrapper();
    setMode('cloud');
    renderHook(() => useCloudBridges({ defaults: STUB_DEFAULTS }), { wrapper });
    await waitFor(() => {
      expect(mockInitCloudAuth).toHaveBeenCalledTimes(1);
    });
    expect(mockInitCloudAuth).toHaveBeenCalledWith({
      byo: null,
      defaults: STUB_DEFAULTS,
    });
  });

  it('does not call initCloudAuth in cloud mode when neither byo nor defaults are set', async () => {
    const wrapper = makeWrapper();
    setMode('cloud');
    renderHook(() => useCloudBridges({ defaults: null }), { wrapper });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockInitCloudAuth).not.toHaveBeenCalled();
  });

  it('switches off when mode flips from cloud to lan (cleanup path)', async () => {
    const wrapper = makeWrapper();
    setMode('cloud');
    const { rerender } = renderHook(() => useCloudBridges({ defaults: STUB_DEFAULTS }), {
      wrapper,
    });
    await waitFor(() => {
      expect(mockInitCloudAuth).toHaveBeenCalledTimes(1);
    });
    mockInitCloudAuth.mockClear();
    setMode('lan-client');
    rerender();
    await new Promise((r) => setTimeout(r, 0));
    // After flipping to LAN, the effect re-runs with the gate set,
    // and initCloudAuth must NOT be called again.
    expect(mockInitCloudAuth).not.toHaveBeenCalled();
  });
});
