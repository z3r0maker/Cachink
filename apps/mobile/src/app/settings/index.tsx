/**
 * Expo Router entry for /settings (hub).
 *
 * Shows the 3-card SettingsHub. Each card navigates to a sub-route
 * under /settings/negocio, /settings/tasas-isr, or /settings/sistema.
 *
 * Empleados moved to top-level /empleados route (Otros grid).
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  SettingsHub,
  ResetDemoAction,
  SeedDemoAction,
  directorSettingsNavItems,
  useCurrentBusiness,
  useFeatureFlags,
  useRole,
  useTranslation,
  type SettingsSection,
} from '@cachink/ui';
import { nativeResetDatabase } from '@cachink/ui/database/reset-native';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

function reloadApp(): void {
  // In dev, DevSettings.reload() restarts the JS bundle
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DevSettings } = require('react-native');
  DevSettings.reload();
}

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

  // Dev-only actions. These used to hang off `(tabs)/otros.tsx`, but review
  // item #7 removed the Otros tab from both bars, leaving that route — and
  // `ResetDemoAction` with it — unreachable, while `SeedDemoAction` was never
  // mounted at all. Configuración is the place both roles can still reach.
  //
  // `SeedDemoAction` is the only demo-seed entry point since the prebeta
  // refactor moved Step1Welcome (owner of `wizard-step1-demo-mode`) out of the
  // first-run path; the ~29 demo E2E flows enter through it.
  const devFooter =
    typeof __DEV__ !== 'undefined' && __DEV__ ? (
      <View style={{ gap: 16 }}>
        <SeedDemoAction />
        <ResetDemoAction resetDatabase={nativeResetDatabase} onReload={reloadApp} />
      </View>
    ) : null;

  return (
    <AppShellWrapper activeTabKey="ajustes" title={t('settings.hubTitle')} onBack={handleBack}>
      <SettingsHub
        business={business}
        onNavigate={handleNavigate}
        navItems={navItems}
        onNavigateTool={(path) => router.push(path as never)}
        footer={devFooter}
      />
    </AppShellWrapper>
  );
}
