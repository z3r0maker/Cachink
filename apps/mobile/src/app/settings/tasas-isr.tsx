/**
 * Expo Router entry for /settings/tasas-isr.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { SettingsTasasIsr, useTranslation } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function TasasIsrRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.tasasIsrCard')}
      onBack={() => router.back()}
    >
      <SettingsTasasIsr />
    </AppShellWrapper>
  );
}
