/**
 * Tauri webview entry point for `apps/desktop`.
 *
 * App-shell only per CLAUDE.md §5.6. Mounts React, the Tamagui provider, and
 * the Phase-0 placeholder screen. Phase 1C replaces the placeholder with the
 * role picker and full router.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@cachink/ui';
import { bootstrapI18n } from '../shell/i18n';
import { PlaceholderScreen } from './placeholder-screen';

bootstrapI18n();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Expected #root element in index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <AppProviders>
      <PlaceholderScreen />
    </AppProviders>
  </StrictMode>,
);
