/**
 * Expo Router entry for /pendientes, «Registros por enviar» (MvPendientes;
 * Track M, M-09): the local queue, «Reintentar ahora» and the records the
 * server refused. Opened from the sync pill, Inicio and Mi turno; the pill
 * here is the static one, as on the web's Pendientes.
 */
import { useCallback, type ReactElement } from 'react';
import { useFocusEffect } from 'expo-router';
import { PendientesScreen, useColaPendiente, usePendientes } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function PendientesRoute(): ReactElement {
  const back = useBackTo('/cobrar');
  const p = usePendientes();
  const { refetch } = useColaPendiente();
  useFocusEffect(useCallback(() => void refetch(), [refetch]));
  return (
    <AppShellWrapper title="Cobrar" backLabel="Volver a Cobrar" onBack={back} headerStatus="static">
      <PendientesScreen {...p} />
    </AppShellWrapper>
  );
}
