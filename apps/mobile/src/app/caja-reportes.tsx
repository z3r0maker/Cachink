/**
 * Expo Router entry for /caja-reportes — cash drawer reports.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CajaReportesScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CajaReportesRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <CajaReportesScreen />
    </AppShellWrapper>
  );
}
