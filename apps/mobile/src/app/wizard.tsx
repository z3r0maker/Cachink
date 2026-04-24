/**
 * Expo Router entry for the first-run wizard (P1C-M2-T03).
 *
 * Mobile wrapper around the shared `Wizard` screen. Writes the selected
 * mode to the AppConfigRepository + updates the Zustand store, then
 * routes to `/wizard/business` for the business-creation step.
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
