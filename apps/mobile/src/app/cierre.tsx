/**
 * Expo Router entry for /cierre (Track M, M-09; boards MvCierre,
 * MvCierreHecho): the count, the expected-vs-counted resumen, the queue band
 * (ADR-123 — close stays enabled with rows still to send), the diferencia's
 * motivo, and the hecho screen with the WhatsApp corte. A stack route OUTSIDE
 * the tabs, as the boards draw it: the count is a focused flow, and the tab
 * bar under the close button ate taps meant for it (M-11).
 */

import type { ReactElement } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { CierreScreen, useCierreTurno } from '@xangarro/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CierreRoute(): ReactElement {
  const router = useRouter();
  const c = useCierreTurno();
  return (
    <AppShellWrapper title="Cierre de turno" onBack={() => router.navigate('/turno' as never)}>
      <CierreScreen
        testID="mobile-cierre"
        state={c.state}
        data={c.data}
        cola={c.cola}
        onCerrar={c.cerrar}
        onRetry={c.refetch}
        onSalir={() => router.navigate('/inicio' as never)}
        onCompartir={(texto) => {
          void Share.share({ message: texto });
        }}
      />
    </AppShellWrapper>
  );
}
