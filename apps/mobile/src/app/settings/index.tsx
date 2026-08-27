/**
 * Expo Router entry for /settings (hub).
 *
 * Shows the 3-card SettingsHub. Each card navigates to a sub-route
 * under /settings/negocio, /settings/tasas-isr, or /settings/sistema.
 *
 * Empleados moved to top-level /empleados route (Otros grid).
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  SettingsHub,
  directorSettingsNavItems,
  useCurrentBusiness,
  useFeatureFlags,
  useRole,
  useTranslation,
  type SettingsSection,
} from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

function useBackToParent(): () => void {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as never);
  };
}

export default function SettingsHubRoute(): ReactElement {
  const router = useRouter();
  const business = useCurrentBusiness().data ?? null;
  const handleBack = useBackToParent();
  const { t } = useTranslation();
  const role = useRole();
  const flags = useFeatureFlags();

  const handleNavigate = (section: SettingsSection): void => {
    router.push(`/settings/${section}` as never);
  };

  // Director dropped the "Otros" tab (review item #7) so Gastos could
  // take its slot; the grid lives here now. Operativo still has the
  // tab, so it is not duplicated for them.
  const navItems = role === 'director' ? directorSettingsNavItems(flags) : undefined;

  return (
    <AppShellWrapper activeTabKey="ajustes" title={t('settings.hubTitle')} onBack={handleBack}>
      <SettingsHub
        business={business}
        onNavigate={handleNavigate}
        navItems={navItems}
        onNavigateTool={(path) => router.push(path as never)}
      />
    </AppShellWrapper>
  );
}
