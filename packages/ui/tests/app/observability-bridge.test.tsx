import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * ObservabilityBridge: the log store is born once the device id exists and
 * lands in the provider, the ref the bug report reads, and — only when an
 * ingest URL is configured AND the shell supplied device context — an
 * outbox flusher wired to the live consent and flags. Without a device id,
 * nothing is created and the children still render.
 */

const { store, createLogStore, HttpRemoteLogStore, OutboxFlusher } = vi.hoisted(() => {
  const store = {
    writeAudit: vi.fn(async () => undefined),
    exportSnapshot: vi.fn(async () => ({})),
  } as unknown as { writeAudit: () => Promise<void>; exportSnapshot: () => Promise<unknown> };
  return {
    store,
    createLogStore: vi.fn(async () => store),
    HttpRemoteLogStore: vi.fn(function (this: unknown) {
      return this;
    }),
    OutboxFlusher: vi.fn(function (this: unknown) {
      return this;
    }),
  };
});

vi.mock('@xangarro/observability', () => ({
  createLogStore,
  HttpRemoteLogStore,
  OutboxFlusher,
}));

let dbActual: unknown = { $client: {} };
let deviceIdActual: string | null = 'dev-1';
let consentActual = true;

vi.mock('../../src/database/index', () => ({ useDatabase: () => dbActual }));
vi.mock('../../src/app-config/index', () => ({
  useDeviceId: () => deviceIdActual,
  useCrashReportingEnabled: () => consentActual,
}));
vi.mock('../../src/observability/use-lifecycle-observer', () => ({
  useLifecycleObserver: vi.fn(),
}));
vi.mock('../../src/observability/use-outbox-flusher', () => ({
  useOutboxFlusher: vi.fn(),
}));
vi.mock('../../src/observability/observability-provider', () => ({
  ObservabilityProvider: (props: { readonly children: unknown }) => <>{props.children}</>,
  useLogStore: () => (deviceIdActual ? store : null),
}));

import { ObservabilityBridge } from '../../src/app/observability-bridge';
import { getLogStoreRef } from '../../src/observability/log-store-ref';

const CONTEXTO = {
  model: 'iPhone 16',
  osName: 'iOS',
  osVersion: '18.1',
  appVersion: '1',
  platform: 'ios',
} as const;

beforeEach(() => {
  createLogStore.mockClear();
  HttpRemoteLogStore.mockClear();
  OutboxFlusher.mockClear();
  dbActual = { $client: {} };
  deviceIdActual = 'dev-1';
  consentActual = true;
  delete process.env.EXPO_PUBLIC_BUG_INGEST_URL;
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_BUG_INGEST_URL;
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
  });

  it('builds the flusher only with an ingest URL and device context, consent wired live', async () => {
    process.env.EXPO_PUBLIC_BUG_INGEST_URL = 'https://ingest.xangarro.mx';
    process.env.EXPO_PUBLIC_CLOUD_ANON_KEY = 'anon-key';
    const logStoreRef = { current: null };
    render(
      <ObservabilityBridge logStoreRef={logStoreRef} deviceContext={CONTEXTO}>
        <p>hola</p>
      </ObservabilityBridge>,
    );
    await waitFor(() => expect(OutboxFlusher).toHaveBeenCalled());
    expect(HttpRemoteLogStore).toHaveBeenCalledWith({
      baseUrl: 'https://ingest.xangarro.mx',
      apiKey: 'anon-key',
    });
    const args = OutboxFlusher.mock.calls[0]?.[0] as {
      getConsent: () => boolean;
      deviceContext: typeof CONTEXTO;
      getFeatureFlags: () => null;
    };
    expect(args.deviceContext).toBe(CONTEXTO);
    // Consent is captured per flusher; a change rebuilds it (the effect's dep).
    expect(args.getConsent()).toBe(true);
    expect(args.getFeatureFlags()).toBeNull();
    delete process.env.EXPO_PUBLIC_CLOUD_ANON_KEY;
  });

  it('no URL or no device context means no flusher', async () => {
    const logStoreRef = { current: null };
    process.env.EXPO_PUBLIC_BUG_INGEST_URL = 'https://ingest.xangarro.mx';
    // deviceContext omitted
    render(
      <ObservabilityBridge logStoreRef={logStoreRef}>
        <p>hola</p>
      </ObservabilityBridge>,
    );
    await waitFor(() => expect(logStoreRef.current).toBe(store));
    expect(OutboxFlusher).not.toHaveBeenCalled();
    expect(getLogStoreRef()).toBe(store);
  });
});
