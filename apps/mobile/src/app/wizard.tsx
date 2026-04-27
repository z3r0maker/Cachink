/**
 * Expo Router entry for the first-run wizard (P1C-M2-T03; updated for
 * ADR-039).
 *
 * Mobile wrapper around the shared `Wizard` screen. Writes the selected
 * mode to the AppConfigRepository + updates the Zustand store, then
 * routes to `/wizard/business` for the business-creation step.
 *
 * This route is normally pre-empted by `<GatedNavigation>` inside
 * `<AppProviders>` (which renders its own WizardGate when `mode === null`).
 * It still ships intact so that explicit `router.replace('/wizard')` calls
 * — e.g. from Settings → "Re-run asistente" between renders — get the
 * exact same UX. Per ADR-039 the wizard writes the final AppMode
 * directly (`'local' | 'cloud' | 'lan-server' | 'lan-client'`); no
 * separate `lanRole` payload to forward.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  APP_CONFIG_KEYS,
  Wizard,
  useAppConfigRepository,
  useSetMode,
  type AppMode,
} from '@cachink/ui';

export default function WizardRoute(): ReactElement {
  const router = useRouter();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  async function handleSelect(mode: AppMode): Promise<void> {
    await appConfig.set(APP_CONFIG_KEYS.mode, mode);
    setMode(mode);
    router.replace('/wizard/business');
  }
  return (
    <Wizard
      platform="mobile"
      onSelectMode={(mode) => {
        void handleSelect(mode);
      }}
    />
  );
}
