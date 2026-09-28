/**
 * Expo Router entry for /egresos («Gastos», MvGastos; Track M, M-08). A stack
 * route opened from Mi turno and Inicio, so it wears the frame with the way
 * back. The register records gastos, pays the recurring ones due today
 * (`?recurrente=<id>` opens that one filled) and keeps its inventory
 * purchase; editing or deleting a gasto is the owner's job in the portal.
 */

import type { ReactElement } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GastosFlow, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function EgresosRoute(): ReactElement {
  const { t } = useTranslation();
  const back = useBackTo('/turno');
  const { recurrente } = useLocalSearchParams<{ recurrente?: string }>();
  return (
    <AppShellWrapper title={t('shell.nav.turno')} onBack={back}>
      <GastosFlow recurrenteId={typeof recurrente === 'string' ? recurrente : undefined} />
    </AppShellWrapper>
  );
}
