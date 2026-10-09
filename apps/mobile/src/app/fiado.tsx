/**
 * Expo Router entry for /fiado (Track M, M-08; boards MvFiadoAbonos): who
 * owes what, a client's account, receiving an abono and reminding a saldo.
 * A stack route opened from Inicio's atajo, so it wears the frame with the
 * way back.
 */

import type { ReactElement } from 'react';
import { CobranzaScreen, useCobranza, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function FiadoRoute(): ReactElement {
  const { t } = useTranslation();
  const back = useBackTo('/inicio');
  const x = useCobranza();
  return (
    <AppShellWrapper title={t('shell.nav.fiado')} onBack={back}>
      <CobranzaScreen
        testID="mobile-fiado"
        state={x.state}
        data={x.data}
        onRegistrar={x.registrar}
        onRetry={x.refetch}
        onBack={back}
      />
    </AppShellWrapper>
  );
}
