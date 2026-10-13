/**
 * Expo Router entry for /no-enviados (Track M, M-09; board MvPorEnviar):
 * the local queue's face — what waits, what retries on its own, what the
 * server refused with its sentence — not only the rejections (A-08's old
 * screen). Opened from the sync pill and Mi turno.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { PorEnviarScreen, usePorEnviar, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function NoEnviadosRoute(): ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const back = useBackTo('/turno');
  const q = usePorEnviar();
  return (
    <AppShellWrapper title={t('shell.nav.turno')} onBack={back} headerStatus="static">
      <PorEnviarScreen
        testID="mobile-por-enviar"
        state={q.state}
        fase={q.fase}
        cola={q.cola}
        rechazados={q.rechazados}
        dueno={q.dueno}
        ultima={q.ultima}
        onReintentar={q.reintentar}
        onReintentarRechazado={q.reintentarRechazado}
        onIrACierre={() => router.navigate('/cierre' as never)}
        onRetry={q.refetch}
      />
    </AppShellWrapper>
  );
}
