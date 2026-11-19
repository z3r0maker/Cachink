/**
 * Expo Router entry for /cierre (Track M, M-09; boards MvCierre,
 * MvCierreHecho, MvTurnoCerrado): the count, the expected-vs-counted resumen,
 * the queue band (ADR-123 — close stays enabled with rows still to send), the
 * diferencia's motivo, and the hecho screen with the WhatsApp corte. A stack
 * route OUTSIDE the tabs, as the boards draw it: the count is a focused flow,
 * and the tab bar under the close button ate taps meant for it (M-11).
 *
 * With no open turno there is nothing to close: «Abrir turno» opens the fondo
 * sheet here, and a turno that just opened has nothing to count, so it goes on
 * to Inicio.
 */

import type { ReactElement } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { CierreScreen, useAperturaTurno, useCierreTurno } from '@xangarro/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CierreRoute(): ReactElement {
  const router = useRouter();
  const c = useCierreTurno();
  // Dismissed first, or the tabs would open a second time over this route.
  const aInicio = (): void => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/inicio' as never);
  };
  const apertura = useAperturaTurno(aInicio);
  // The header's title is its way back, which leads to Mi turno; the sin-turno
  // state carries its own «Cierre de turno» heading.
  const titulo = c.state === 'sin-turno' ? 'Mi turno' : 'Cierre de turno';
  return (
    <AppShellWrapper title={titulo} onBack={() => router.navigate('/turno' as never)}>
      <CierreScreen
        testID="mobile-cierre"
        state={c.state}
        data={c.data}
        cola={c.cola}
        onCerrar={c.cerrar}
        onRetry={c.refetch}
        onSalir={aInicio}
        onAbrirTurno={apertura.abrir}
        onCompartir={(texto) => {
          void Share.share({ message: texto });
        }}
      />
      {apertura.hoja}
    </AppShellWrapper>
  );
}
