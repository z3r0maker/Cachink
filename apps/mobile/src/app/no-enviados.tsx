/**
 * Expo Router entry for /no-enviados (A-08): records the server rejected,
 * each with its reason and "Reintentar". Opened from the sync pill.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { SyncRejectedScreen, useRejectedRows, useTranslation } from '@xangarro/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function NoEnviadosRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { rows, retry } = useRejectedRows();
  const handleBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace('/ventas' as never);
  };
  return (
    <AppShellWrapper activeTabKey="caja" title={t('noEnviados.title')} onBack={handleBack}>
      <SyncRejectedScreen rows={rows} onRetry={retry} />
    </AppShellWrapper>
  );
}
