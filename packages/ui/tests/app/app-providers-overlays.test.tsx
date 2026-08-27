/**
 * AppProviders overlays-slot structural test (Round 3 F1, amended).
 *
 * Regression guard for the latent bug surfaced in Round 3:
 * `<MobileScannerHost />` and `<CloudInnerScreenHost />` were mounted as
 * children of `<AppProviders>`. When `<GatedNavigation>` short-circuits
 * (it returns `null` before hydration, and `<LanGate>`/`<CloudGate>`
 * ignore `props.children`), the overlay components were silently
 * dropped. Result: tapping "Escanear QR" on the LAN pairing screen never
 * opened the camera; tapping "¿Olvidaste tu contraseña?" on Cloud
 * onboarding never showed the password-reset screen.
 *
 * The fix is a dedicated `overlays?: ReactNode` slot rendered as a
 * **sibling of the gated content**, so gate state can never drop it.
 *
 * AMENDED (commit 5f76068): the slot originally sat outside
 * `<DatabaseProvider>` too. `<NotificationTapHost>` calls
 * `useRepositories()`, so it threw on launch from there. Overlays now
 * render *inside* the data providers and *outside* the gate chain. The
 * consequence is deliberate and documented in app-providers.tsx: an
 * overlay does not mount until the DB resolves and a deviceId exists
 * (`DrizzleRepositoryBridge` returns null without one). What must never
 * regress is the gate-chain independence, which is what this file tests.
 *
 * The data providers are stubbed to pass-throughs because they are not
 * under test — the contract under test is the JSX shape of
 * `AppProviders` itself: `{content}` and `{props.overlays}` are
 * siblings.
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type * as DatabaseModule from '../../src/database/index';
import type * as BridgesModule from '../../src/app/app-provider-bridges';

function passthrough({ children }: { readonly children?: ReactNode }): ReactElement {
  return <>{children}</>;
}

// The gate chain is the thing overlays must survive. `null` stands in for
// every short-circuit it has: !hydrated, <LanGate>, <CloudGate>.
const gateRendersChildren = { current: false };

vi.mock('../../src/app/gated-navigation', () => ({
  GatedNavigation: ({ children }: { readonly children?: ReactNode }): ReactElement | null =>
    gateRendersChildren.current ? <>{children}</> : null,
}));

vi.mock('../../src/database/index', async (importOriginal) => ({
  ...(await importOriginal<typeof DatabaseModule>()),
  DatabaseProvider: passthrough,
}));

vi.mock('../../src/app/app-provider-bridges', async (importOriginal) => ({
  ...(await importOriginal<typeof BridgesModule>()),
  DrizzleAppConfigBridge: passthrough,
  DrizzleRepositoryBridge: passthrough,
  ObservabilityBridge: passthrough,
  TelemetryBridge: passthrough,
}));

import { AppProviders } from '../../src/app/index';
import { initI18n } from '../../src/i18n/index';

initI18n();

function TestOverlay(): ReactElement {
  return <div data-testid="round3-test-overlay">overlay-mounted</div>;
}

describe('AppProviders overlays slot (Round 3 F1)', () => {
  beforeEach(() => {
    cleanup();
    gateRendersChildren.current = false;
  });

  it('renders the overlays slot as a sibling of the gate chain so it survives a short-circuiting gate', () => {
    render(
      <AppProviders platform="desktop" overlays={<TestOverlay />}>
        <div data-testid="round3-app-body">app</div>
      </AppProviders>,
    );

    // The gate chain rendered nothing → app-body is NOT in the document.
    expect(screen.queryByTestId('round3-app-body')).toBeNull();
    // …but the overlay must still be present because it's outside the
    // gate chain (Round 3 F1 contract).
    expect(screen.getByTestId('round3-test-overlay')).toBeInTheDocument();
  });

  it('renders overlays alongside children once the gate chain lets the app through', () => {
    gateRendersChildren.current = true;
    render(
      <AppProviders platform="desktop" overlays={<TestOverlay />}>
        <div data-testid="round3-app-body">app</div>
      </AppProviders>,
    );
    expect(screen.getByTestId('round3-app-body')).toBeInTheDocument();
    expect(screen.getByTestId('round3-test-overlay')).toBeInTheDocument();
  });

  it('omits the overlay region when no overlays prop is supplied', () => {
    render(
      <AppProviders platform="desktop">
        <div data-testid="round3-no-overlay-children">app</div>
      </AppProviders>,
    );
    expect(screen.queryByTestId('round3-test-overlay')).toBeNull();
    // Children also missing for the same gate-chain reason — the absence
    // of an overlay shouldn't change that.
    expect(screen.queryByTestId('round3-no-overlay-children')).toBeNull();
  });

  it('renders multiple overlay nodes when provided as a fragment (mobile shell shape)', () => {
    render(
      <AppProviders
        platform="mobile"
        overlays={
          <>
            <div data-testid="round3-overlay-a">a</div>
            <div data-testid="round3-overlay-b">b</div>
          </>
        }
      >
        <div data-testid="round3-app-body">app</div>
      </AppProviders>,
    );
    expect(screen.getByTestId('round3-overlay-a')).toBeInTheDocument();
    expect(screen.getByTestId('round3-overlay-b')).toBeInTheDocument();
  });
});
