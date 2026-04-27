/**
 * LanGate state-machine tests (Slice 8 M3-C12; updated for ADR-039).
 *
 * Covers the four branches the gate has after the lan-server / lan-client
 * AppMode split:
 *   - loading (any of the two sync-state queries pending) → null
 *   - paired client (real `auth.accessToken` + mode='lan-client') → children
 *   - ready host (mode='lan-server' + `lanHostReady === true`) → children
 *   - undecided → LanHostScreen / LanJoinScreen by mode
 *
 * Stubs `useLanAuthToken` + `useLanHostReady` directly so the test runs
 * in the lightweight node-style provider tree without hitting SQLite or
 * TanStack Query. `useLanRole` was retired in ADR-039.
 */

import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LanGate, type LanBridges } from '../../src/app/lan-gate';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

// Mutable mocks for the two hooks the gate consumes.
let MOCK_TOKEN: string | null = null;
let MOCK_TOKEN_LOADING = false;
let MOCK_HOST_READY = false;
let MOCK_HOST_READY_LOADING = false;

vi.mock('../../src/hooks/use-lan-auth', () => ({
  useLanAuthToken: () => ({
    token: MOCK_TOKEN,
    businessId: null,
    loading: MOCK_TOKEN_LOADING,
  }),
  useLanHostReady: () => ({
    ready: MOCK_HOST_READY,
    loading: MOCK_HOST_READY_LOADING,
  }),
}));

function makeBridges(overrides?: Partial<LanBridges>): LanBridges {
  return {
    pair: vi.fn().mockResolvedValue({
      serverUrl: 'http://1.2.3.4:43812',
      accessToken: 'tok',
      businessId: '01HX9999999999999999999999',
    }),
    onPaired: vi.fn(),
    deviceId: 'DEV-1',
    ...overrides,
  };
}

function renderGate(
  children: ReactElement,
  bridges: LanBridges | null,
  mode: 'lan-server' | 'lan-client' = 'lan-client',
) {
  return renderWithProviders(
    <LanGate bridges={bridges} mode={mode}>
      {children}
    </LanGate>,
  );
}

describe('LanGate (Slice 8 M3-C12, ADR-039)', () => {
  beforeEach(() => {
    MOCK_TOKEN = null;
    MOCK_TOKEN_LOADING = false;
    MOCK_HOST_READY = false;
    MOCK_HOST_READY_LOADING = false;
  });

  it('returns null while any sync-state query is loading', () => {
    MOCK_TOKEN_LOADING = true;
    renderGate(<span data-testid="children">app</span>, makeBridges());
    expect(screen.queryByTestId('children')).toBeNull();
    expect(screen.queryByTestId('lan-join-screen')).toBeNull();
    expect(screen.queryByTestId('lan-host-screen')).toBeNull();
  });

  it('renders children when a real client access token is stored', () => {
    MOCK_TOKEN = 'real-bearer-token';
    renderGate(<span data-testid="children">app</span>, makeBridges(), 'lan-client');
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders LanHostScreen when mode=lan-server + bridges.startServer is provided', () => {
    const bridges = makeBridges({
      startServer: vi.fn().mockResolvedValue({
        url: 'http://192.168.1.5:43812',
        pairingToken: 'pair-token',
        qrPngBase64: 'AAAA',
      }),
      onServerStarted: vi.fn(),
    });
    renderGate(<span data-testid="children">app</span>, bridges, 'lan-server');
    expect(screen.getByTestId('lan-host-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).toBeNull();
  });

  it('renders children when a host has finished setup (mode=lan-server + lanHostReady=true)', () => {
    MOCK_HOST_READY = true;
    renderGate(<span data-testid="children">app</span>, makeBridges(), 'lan-server');
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders LanJoinScreen by default (lan-client + unpaired) when bridges are present', () => {
    renderGate(<span data-testid="children">app</span>, makeBridges(), 'lan-client');
    expect(screen.getByTestId('lan-join-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).toBeNull();
  });

  it('returns null when bridges are missing and the device is unpaired', () => {
    renderGate(<span data-testid="children">app</span>, null, 'lan-client');
    expect(screen.queryByTestId('children')).toBeNull();
    expect(screen.queryByTestId('lan-join-screen')).toBeNull();
  });
});
