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
  useCurrentBusiness,
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

  const handleNavigate = (section: SettingsSection): void => {
    router.push(`/settings/${section}` as never);
  };

  return (
    <AppShellWrapper activeTabKey="ajustes" title={t('settings.hubTitle')} onBack={handleBack}>
      <SettingsHub
        business={business}
        onNavigate={handleNavigate}
      />
    </AppShellWrapper>
  );
}
