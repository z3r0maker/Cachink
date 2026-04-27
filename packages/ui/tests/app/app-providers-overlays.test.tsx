/**
 * AppProviders overlays-slot integration test (Round 3 F1).
 *
 * Regression guard for the latent bug surfaced in Round 3:
 * `<MobileScannerHost />` and `<CloudInnerScreenHost />` were mounted as
 * children of `<AppProviders>`. When `<GatedNavigation>` returned a
 * `<LanGate>` or `<CloudGate>` (which ignore `props.children`), the
 * overlay components were silently dropped. Result: tapping "Escanear
 * QR" on the LAN pairing screen never opened the camera; tapping
 * "¿Olvidaste tu contraseña?" on Cloud onboarding never showed the
 * password-reset screen.
 *
 * The fix moves overlays to a dedicated `overlays?: ReactNode` slot
 * that renders inside `<TamaguiProvider>` + `<AppErrorBoundary>` but
 * **outside** `<DatabaseProvider>` and the gate chain — so they always
 * mount regardless of gate state.
 *
 * The test below proves the contract by:
 *   1. Mocking `@tauri-apps/plugin-sql` so `<DatabaseProvider>` never
 *      resolves (mirrors the behaviour during a slow boot, a Cloud
 *      pairing flow before the user has signed in, etc.).
 *   2. Rendering `<AppProviders>` with both `children` and `overlays`.
 *   3. Asserting the overlay is in the document even though `children`
 *      are not (the DB hasn't loaded → the gate chain hasn't rendered).
 */

import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { AppProviders } from '../../src/app/index';
import { initI18n } from '../../src/i18n/index';
import { useAppConfigStore } from '../../src/app-config/index';

// Stop Tauri's plugin from trying to talk to the (non-existent) WebView
// IPC bridge under JSDOM. The DatabaseProvider catches the rejection in
// its async factory and renders null — the exact state where overlays
// must still survive.
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockRejectedValue(new Error('Tauri not available in tests')),
  },
}));

initI18n();

function TestOverlay(): ReactElement {
  return <div data-testid="round3-test-overlay">overlay-mounted</div>;
}

describe('AppProviders overlays slot (Round 3 F1)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanup();
    // Reset to a clean store so other tests don't bleed mode/role through.
    act(() => {
      useAppConfigStore.setState({
        hydrated: false,
        mode: null,
        currentBusinessId: null,
        role: null,
        deviceId: null,
      });
    });
    // Silence the expected `[DatabaseProvider] failed to initialize` log
    // so the test output stays readable. The error is the path under test
    // (DB never resolves → gate stays null).
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders the overlays slot as a sibling of the gate chain so it survives a stuck DatabaseProvider', () => {
    render(
      <AppProviders platform="desktop" overlays={<TestOverlay />}>
        <div data-testid="round3-app-body">app</div>
      </AppProviders>,
    );

    // DB never resolves → DrizzleAppConfigBridge never renders → the
    // gate chain returns null → app-body is NOT in the document.
    expect(screen.queryByTestId('round3-app-body')).toBeNull();
    // …but the overlay must still be present because it's outside the
    // gate chain (Round 3 F1 contract).
    expect(screen.getByTestId('round3-test-overlay')).toBeInTheDocument();
  });

  it('omits the overlay region when no overlays prop is supplied', () => {
    render(
      <AppProviders platform="desktop">
        <div data-testid="round3-no-overlay-children">app</div>
      </AppProviders>,
    );
    expect(screen.queryByTestId('round3-test-overlay')).toBeNull();
    // Children also missing for the same DB-stuck reason — the absence
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
