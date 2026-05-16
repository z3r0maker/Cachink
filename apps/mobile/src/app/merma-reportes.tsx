/**
 * Expo Router entry for /merma-reportes — shrinkage reports.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { MermaReportesScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function MermaReportesRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <MermaReportesScreen />
    </AppShellWrapper>
  );
}
