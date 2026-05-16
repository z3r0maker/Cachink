/**
 * Expo Router entry for /empleados (top-level route).
 *
 * Empleados moved from Settings to Otros grid — Director-only.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { SettingsEmpleados, useTranslation } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function EmpleadosRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppShellWrapper
      activeTabKey="otros"
      title={t('settings.empleadosCard')}
      onBack={() => router.back()}
    >
      <SettingsEmpleados />
    </AppShellWrapper>
  );
}
