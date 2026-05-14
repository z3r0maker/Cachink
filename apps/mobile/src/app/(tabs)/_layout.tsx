/**
 * Persistent tab layout for main Cachink! screens.
 *
 * Phase 4 restructure: 4 tabs per role. Feature-flag-driven tab swapping
 * (Merma ↔ Productos for Operativo). `onChangeRole` now clears userId
 * (locks the screen) instead of routing to the old role-picker.
 */

import type { ReactElement } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import {
  AppShell,
  useCurrentBusiness,
  useMode,
  useRole,
  useFeatureFlags,
  useSetUserId,
} from '@cachink/ui';

/**
 * Map the current pathname to the matching BottomTabBar `activeKey`.
 */
function deriveActiveTab(pathname: string, role: string | null): string {
  const segment = pathname.replace(/^\/+/, '');
  switch (segment) {
    case 'ventas':
    case 'gastos':
    case 'productos':
    case 'estados':
    case 'merma':
    case 'otros':
      return segment;
    default:
      return role === 'director' ? 'home' : 'ventas';
  }
}

export default function TabsLayout(): ReactElement | null {
  const role = useRole();
  const mode = useMode();
  const router = useRouter();
  const pathname = usePathname();
  const business = useCurrentBusiness().data ?? null;
  const setUserId = useSetUserId();
  const flags = useFeatureFlags();

  if (!role) return null;

  const activeTabKey = deriveActiveTab(pathname, role);

  return (
    <AppShell
      role={role}
      activeTabKey={activeTabKey}
      mode={mode}
      flags={flags}
      title={business?.nombre ?? undefined}
      onNavigate={(path) => router.replace(path as never)}
      onChangeRole={() => {
        // Lock screen → QuickSwitchScreen renders via GatedNavigation
        setUserId(null);
      }}
      onOpenSettings={() => router.push('/settings' as never)}
    >
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={() => null}
      />
    </AppShell>
  );
}
