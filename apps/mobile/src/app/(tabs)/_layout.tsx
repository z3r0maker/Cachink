/**
 * Persistent tab layout. Single role (ADR-053): one tab bar for every
 * Operator. Tapping the avatar locks the screen (clears userId) so
 * GatedNavigation shows QuickSwitch for the next Operator.
 */

import type { ReactElement } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { AppShell, useCurrentBusiness, useMode, useFeatureFlags, useSetUserId } from '@xangarro/ui';

/** Map the current pathname to the matching BottomTabBar `activeKey`. */
function deriveActiveTab(pathname: string): string {
  const segment = pathname.replace(/^\/+/, '');
  switch (segment) {
    case 'ventas':
    case 'productos':
    case 'merma':
    case 'caja':
      return segment;
    case 'egresos':
    case 'gastos':
      return 'gastos';
    default:
      return 'ventas';
  }
}

export default function TabsLayout(): ReactElement {
  const mode = useMode();
  const router = useRouter();
  const pathname = usePathname();
  const business = useCurrentBusiness().data ?? null;
  const setUserId = useSetUserId();
  const flags = useFeatureFlags();
  return (
    <AppShell
      activeTabKey={deriveActiveTab(pathname)}
      mode={mode}
      flags={flags}
      title={business?.nombre ?? undefined}
      onNavigate={(path) => router.replace(path as never)}
      onSwitchOperator={() => setUserId(null)}
      onOpenSettings={() => router.push('/settings' as never)}
    >
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => null} />
    </AppShell>
  );
}
