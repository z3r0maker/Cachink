/**
 * Expo Router entry for /ventas-credito — credit sales overview.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { VentasCreditoScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function VentasCreditoRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <VentasCreditoScreen />
    </AppShellWrapper>
  );
}
