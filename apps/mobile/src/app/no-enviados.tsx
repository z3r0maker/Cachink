/**
 * Expo Router entry for /no-enviados (A-08): records the server rejected,
 * each with its reason and "Reintentar". Opened from the sync pill.
 */

import type { ReactElement } from 'react';
import { SyncRejectedScreen, useRejectedRows, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function NoEnviadosRoute(): ReactElement {
  const { t } = useTranslation();
  const { rows, retry } = useRejectedRows();
  const handleBack = useBackTo('/turno');
  return (
    <AppShellWrapper title={t('shell.nav.turno')} onBack={handleBack} headerStatus="static">
      <SyncRejectedScreen rows={rows} onRetry={retry} />
    </AppShellWrapper>
  );
}
