/**
 * Expo Router entry for /settings/empleados.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { SettingsEmpleados, useTranslation } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function EmpleadosRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.empleadosCard')}
      onBack={() => router.back()}
    >
      <SettingsEmpleados />
    </AppShellWrapper>
  );
}
