/**
 * Expo Router entry for /cierre («Cierre de turno», MvCierre and
 * MvCierreHecho; Track M, M-09). A stack route opened from Mi turno's
 * «Cerrar turno» (and the tablet rail's), with the way back and the static
 * sync pill. The count by denomination, the difference and its motive, and
 * the close through `CerrarCajaUseCase`; records still to send warn, never
 * block (ADR-123). Once closed: the corte, «Mandar el corte a …» through the
 * phone's share sheet, and «Salir», which locks the caja back to Acceso.
 */

import { useCallback, type ReactElement } from 'react';
import { Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CierreScreen,
  useCierreMovil,
  useSetUserId,
  useTranslation,
  textoDelCorte,
  type CierreHecho,
} from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

function compartir(h: CierreHecho): void {
  void Share.share({ message: textoDelCorte(h) }).catch(() => undefined);
}

export default function CierreRoute(): ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const back = useBackTo('/turno');
  const setUserId = useSetUserId();
  const x = useCierreMovil();
  const { refetch, hecho } = x;
  useFocusEffect(useCallback(() => (hecho ? undefined : refetch()), [refetch, hecho]));
  return (
    <AppShellWrapper
      title={t('shell.nav.turno')}
      onBack={hecho ? undefined : back}
      headerStatus="static"
    >
      <CierreScreen
        x={x}
        onVerCuales={() => router.navigate('/pendientes' as never)}
        onCompartir={compartir}
        onSalir={() => {
          router.replace('/inicio' as never);
          setUserId(null);
        }}
        onVolver={() => router.replace('/turno' as never)}
      />
    </AppShellWrapper>
  );
}
