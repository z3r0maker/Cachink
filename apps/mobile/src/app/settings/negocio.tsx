/**
 * Expo Router entry for /settings/negocio.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  SettingsNegocio,
  useCurrentBusiness,
  useMode,
  useTranslation,
} from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function NegocioRoute(): ReactElement {
  const router = useRouter();
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const { t } = useTranslation();

  return (
    <AppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.negocioCard')}
      onBack={() => router.back()}
    >
      <SettingsNegocio mode={mode} business={business} />
    </AppShellWrapper>
  );
}
