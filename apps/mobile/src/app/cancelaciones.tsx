/**
 * Expo Router entry for /cancelaciones — sale cancellation management.
 *
 * Thin wrapper around CancelacionesScreen (packages/ui).
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CancelacionesScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CancelacionesRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <CancelacionesScreen testID="mobile-cancelaciones" />
    </AppShellWrapper>
  );
}
