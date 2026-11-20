/**
 * Expo Router entry for /fiado (Track M, M-08; boards MvFiadoAbonos): who
 * owes what, as compact rows (RvFiado); a row opens the client's page,
 * /cobranza/[cliente], where the abono and the reminder live.
 * A stack route opened from Inicio's atajo, so it wears the frame with the
 * way back.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CobranzaScreen, useCobranza, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function FiadoRoute(): ReactElement {
  const { t } = useTranslation();
  const back = useBackTo('/inicio');
  const router = useRouter();
  const x = useCobranza();
  return (
    <AppShellWrapper title={t('shell.nav.fiado')} onBack={back}>
      <CobranzaScreen
        testID="mobile-fiado"
        state={x.state}
        data={x.data}
        onAbrirCliente={(id) => router.push(`/cobranza/${encodeURIComponent(id)}` as never)}
        onRetry={x.refetch}
        onBack={back}
      />
    </AppShellWrapper>
  );
}
