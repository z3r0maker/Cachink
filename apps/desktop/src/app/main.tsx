/**
 * Tauri webview entry point for `apps/desktop` (P1C-M10 S4-C1).
 *
 * App-shell only per CLAUDE.md §5.6. Mounts:
 *   1. `<AppProviders>` — the composed provider chain from @cachink/ui.
 *   2. `<DesktopRouter>` — state-based path router. A full wouter /
 *      react-router swap is parked for Phase 1D (sync-state badge
 *      already renders on the desktop AppShell; deep links arrive with
 *      LAN pairing).
 *
 * Slice 8 C2/C3 add the desktop LAN bridges so `LanGate` (inside
 * `AppProviders`) can render the host or pairing screen with platform
 * IO actually wired. The bridges are passed as hook factories — see the
 * `AppProvidersHooks` contract — so the bridges hook can read AppConfig
 * + the SQLite handle from inside the provider tree.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders, type AppProvidersHooks } from '@cachink/ui';
import { useLanHandle } from '@cachink/ui/sync';
import { bootstrapI18n } from '../shell/i18n';
import { DesktopRouter } from './desktop-router';
import { useDesktopLanBridges } from '../shell/use-lan-bridges';
import { useDesktopCloudBridges } from '../shell/use-cloud-bridges';
import { useDesktopCloudHandle } from '../shell/use-cloud-handle';
import { CloudInnerScreenHost } from '../shell/cloud-navigation';

bootstrapI18n();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Expected #root element in index.html');
}

const desktopHooks: AppProvidersHooks = {
  useLan: useDesktopLanBridges,
  useLanHandle,
  useCloud: useDesktopCloudBridges,
  useCloudHandle: useDesktopCloudHandle,
};

createRoot(rootEl).render(
  <StrictMode>
    <AppProviders platform="desktop" hooks={desktopHooks} overlays={<CloudInnerScreenHost />}>
      <DesktopRouter />
    </AppProviders>
  </StrictMode>,
);
