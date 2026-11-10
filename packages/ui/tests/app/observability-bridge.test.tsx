import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * ObservabilityBridge: the log store is born once the device id exists and
 * lands in the provider and in the ref the bug report reads. Without a device
 * id, nothing is created and the children still render.
 *
 * The log stays on the device (N-81, ADR-141). The bridge once shipped error
 * batches to a Supabase edge function with the public anon key; nothing does
 * that now. What leaves is a bug report the person sends, through the device
 * API, and crash telemetry through Sentry, both behind the same consent.
 */

const { store, createLogStore } = vi.hoisted(() => {
  const store = {
    writeAudit: vi.fn(async () => undefined),
    exportSnapshot: vi.fn(async () => ({})),
  } as unknown as { writeAudit: () => Promise<void>; exportSnapshot: () => Promise<unknown> };
  return { store, createLogStore: vi.fn(async () => store) };
});

// Only what the bridge may use: reaching for a remote store would be `undefined` here.
vi.mock('@xangarro/observability', () => ({ createLogStore }));

let dbActual: unknown = { $client: {} };
let deviceIdActual: string | null = 'dev-1';

vi.mock('../../src/database/index', () => ({ useDatabase: () => dbActual }));
vi.mock('../../src/app-config/index', () => ({
  useDeviceId: () => deviceIdActual,
  useCrashReportingEnabled: () => true,
}));
vi.mock('../../src/observability/use-lifecycle-observer', () => ({
  useLifecycleObserver: vi.fn(),
}));
vi.mock('../../src/observability/observability-provider', () => ({
  ObservabilityProvider: (props: { readonly children: unknown }) => <>{props.children}</>,
  useLogStore: () => (deviceIdActual ? store : null),
}));

import { ObservabilityBridge } from '../../src/app/observability-bridge';
import { getLogStoreRef } from '../../src/observability/log-store-ref';

const fetchSpy = vi.fn();

beforeEach(() => {
  createLogStore.mockClear();
  fetchSpy.mockClear();
  vi.stubGlobal('fetch', fetchSpy);
  dbActual = { $client: {} };
  deviceIdActual = 'dev-1';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.EXPO_PUBLIC_BUG_INGEST_URL;
  delete process.env.EXPO_PUBLIC_CLOUD_ANON_KEY;
});

describe('ObservabilityBridge', () => {
  it('renders the children with no device id, and creates nothing', async () => {
    deviceIdActual = null;
    render(
      <ObservabilityBridge logStoreRef={{ current: null }}>
        <p>hola</p>
      </ObservabilityBridge>,
    );
    expect(await screen.findByText('hola')).toBeInTheDocument();
    expect(createLogStore).not.toHaveBeenCalled();
  });

  it('creates the store once the device id exists, and hands it to the provider and the ref', async () => {
    const logStoreRef = { current: null };
    render(
      <ObservabilityBridge logStoreRef={logStoreRef}>
        <p>hola</p>
      </ObservabilityBridge>,
    );
    await waitFor(() => expect(logStoreRef.current).toBe(store));
    expect(createLogStore).toHaveBeenCalledWith({ db: {}, deviceId: 'dev-1', isDev: false });
    expect(getLogStoreRef()).toBe(store);
  });

  it('ships nothing on its own, whatever an old build environment still sets', async () => {
    process.env.EXPO_PUBLIC_BUG_INGEST_URL = 'https://ingest.xangarro.mx';
    process.env.EXPO_PUBLIC_CLOUD_ANON_KEY = 'anon-key';
    const logStoreRef = { current: null };
    // What a shell built before N-81 still passes: the two things that used to
    // switch the error outbox on. Spread as plain props, so this keeps
    // compiling once the bridge no longer declares them.
    const olderShell: object = {
      deviceContext: { model: 'iPhone 16', osName: 'iOS', osVersion: '18.1', appVersion: '1' },
      getFeatureFlags: () => null,
    };
    render(
      <ObservabilityBridge logStoreRef={logStoreRef} {...olderShell}>
        <p>hola</p>
      </ObservabilityBridge>,
    );
    await waitFor(() => expect(logStoreRef.current).toBe(store));
    expect(await screen.findByText('hola')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
