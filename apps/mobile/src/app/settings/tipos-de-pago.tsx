/**
 * Expo Router entry for /settings/tipos-de-pago.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { TiposDePagoScreen, useTranslation } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function TiposDePagoRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.tiposDePagoCard')}
      onBack={() => router.back()}
    >
      <TiposDePagoScreen />
    </AppShellWrapper>
  );
}
