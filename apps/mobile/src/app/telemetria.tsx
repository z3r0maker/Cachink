/**
 * Expo Router entry for /telemetria — dev-only observability dashboard.
 *
 * Hard-gated: redirects to home in production builds.
 */

import type { ReactElement } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { TelemetriaScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function TelemetriaRoute(): ReactElement {
  const router = useRouter();

  // Belt-and-suspenders: unreachable from Otros grid in prod, but
  // also hard-gate the route itself for safety.
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return <Redirect href="/" /> as unknown as ReactElement;
  }

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <TelemetriaScreen />
    </AppShellWrapper>
  );
}
