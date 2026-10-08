/**
 * Expo Router entry for /avisos, «Avisos» (MvAvisos; Track M, M-09): the
 * owner's messages to this operator and what the caja itself flags. Opened
 * from the header bell and Inicio; a stack route with the way back to Inicio.
 */
import { useCallback, type ReactElement } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { AvisosScreen, rutaMovil, useAvisosCaja } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function AvisosRoute(): ReactElement {
  const router = useRouter();
  const back = useBackTo('/inicio');
  const avisos = useAvisosCaja();
  const { refetch } = avisos;
  useFocusEffect(useCallback(() => refetch(), [refetch]));
  return (
    <AppShellWrapper title="Inicio" backLabel="Volver a Inicio" onBack={back}>
      <AvisosScreen
        state={avisos.state}
        data={avisos.data}
        onMarcar={avisos.marcar}
        onResponder={avisos.responder}
        rutaDe={rutaMovil}
        onIr={(ruta) => router.push(ruta as never)}
        onRetry={refetch}
      />
    </AppShellWrapper>
  );
}
