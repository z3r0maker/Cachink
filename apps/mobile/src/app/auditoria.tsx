/**
 * Expo Router entry for /auditoria — inventory audit.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { AuditoriaScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function AuditoriaRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <AuditoriaScreen />
    </AppShellWrapper>
  );
}
