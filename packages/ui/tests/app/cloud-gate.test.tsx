/**
 * CloudGate state-machine tests (Slice 8 M3-C12).
 *
 * Covers the four branches:
 *   - loading (`useCloudSession.isLoading`) → null
 *   - signedIn → children
 *   - bridges null → null
 *   - bridges present + signed-out → CloudOnboardingScreen (with the
 *     `backendConfigured` flag flowing through to the disabled-notice
 *     branch when no auth handle exists)
 *
 * Stubs `useCloudSession` directly so the test file doesn't need to
 * mount the full provider tree or wait on async session reads.
 */

import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CloudGate, type CloudBridges } from '../../src/app/cloud-gate';
import type { CloudAuthHandle, CloudCredentials } from '../../src/sync/cloud-bridge';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

let MOCK_SESSION = {
  credentials: null as CloudCredentials | null,
  signedIn: false,
  isLoading: false,
  error: null as Error | null,
  signOut: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('../../src/hooks/use-cloud-session', () => ({
  useCloudSession: () => MOCK_SESSION,
}));

function makeHandle(): CloudAuthHandle {
  return {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => () => undefined),
  };
}

function makeBridges(overrides?: Partial<CloudBridges>): CloudBridges {
  return {
    authHandle: makeHandle(),
    backendConfigured: true,
    onSuccess: vi.fn(),
    ...overrides,
  };
}

function renderGate(children: ReactElement, bridges: CloudBridges | null) {
  return renderWithProviders(<CloudGate bridges={bridges}>{children}</CloudGate>);
}

describe('CloudGate (Slice 8 M3-C12)', () => {
  beforeEach(() => {
    MOCK_SESSION = {
      credentials: null,
      signedIn: false,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      refresh: vi.fn(),
    };
  });

  it('returns null while the initial session read is loading', () => {
    MOCK_SESSION.isLoading = true;
    renderGate(<span data-testid="children">app</span>, makeBridges());
    expect(screen.queryByTestId('children')).toBeNull();
    expect(screen.queryByTestId('cloud-email-input')).toBeNull();
    expect(screen.queryByTestId('cloud-onboarding-disabled')).toBeNull();
  });

  it('renders children when the session is signed in', () => {
    MOCK_SESSION.signedIn = true;
    MOCK_SESSION.credentials = {
      accessToken: 'tok',
      userId: 'u1',
      businessId: '01HX9999999999999999999999',
      role: 'Director',
      expiresAt: Date.now() + 3_600_000,
    };
    renderGate(<span data-testid="children">app</span>, makeBridges());
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders the CloudOnboardingScreen when bridges exist and the user is signed out', () => {
    renderGate(<span data-testid="children">app</span>, makeBridges());
    expect(screen.getByTestId('cloud-email-input')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).toBeNull();
  });

  it('passes backendConfigured=false through so the disabled notice renders', () => {
    renderGate(
      <span data-testid="children">app</span>,
      makeBridges({ authHandle: null, backendConfigured: false }),
    );
    expect(screen.getByTestId('cloud-onboarding-disabled')).toBeInTheDocument();
    expect(screen.queryByTestId('cloud-email-input')).toBeNull();
  });

  it('returns null when bridges are missing and the user is signed out', () => {
    renderGate(<span data-testid="children">app</span>, null);
    expect(screen.queryByTestId('children')).toBeNull();
    expect(screen.queryByTestId('cloud-email-input')).toBeNull();
  });
});
