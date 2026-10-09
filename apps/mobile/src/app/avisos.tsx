/**
 * Expo Router entry for /avisos (Track M, M-09; board MvAvisos): the owner's
 * messages and the caja's, replies from the phone. The caja's cta hrefs are
 * the web's `/operador/...` paths; `rutaMovil` maps them (or nothing). A
 * stack route opened from the header bell, so it wears the frame with the
 * way back.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { AvisosScreen, rutaMovil, useAvisos, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function AvisosRoute(): ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const back = useBackTo('/inicio');
  const a = useAvisos();
  return (
    <AppShellWrapper title={t('shell.nav.avisos')} onBack={back}>
      <AvisosScreen
        testID="mobile-avisos"
        tab="dueno"
        state={a.state}
        data={a.data}
        vivo={a.vivo}
        onAbrir={(href) => {
          const ruta = rutaMovil(href);
          if (ruta !== null) router.navigate(ruta as never);
        }}
        onRetry={a.refetch}
      />
    </AppShellWrapper>
  );
}
