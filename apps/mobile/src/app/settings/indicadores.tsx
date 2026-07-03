/**
 * Expo Router entry for /settings/indicadores — health threshold
 * configuration screen.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { SettingsIndicadores } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function SettingsIndicadoresRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="ajustes" onBack={() => router.back()}>
      <SettingsIndicadores />
    </AppShellWrapper>
  );
}
