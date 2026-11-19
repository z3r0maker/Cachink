/**
 * Expo Router entry for /cierre (Track M, M-17; boards MvCierreFlujo,
 * MvTurnoCerrado; ADR-147): two steps, the count and then the result, the
 * queue band (ADR-123: the close stays enabled with rows still to send), and
 * the hecho screen with the corte to send and «Abrir otro turno». A stack
 * route OUTSIDE the tabs: the count is a focused flow, and the tab bar under
 * the close button ate taps meant for it (M-11).
 *
 * The header's back follows the step: from the result it returns to the
 * count, otherwise to Mi turno. With no open turno there is nothing to close:
 * «Abrir turno» opens the fondo sheet here; a turno that just opened, from
 * there or from «Abrir otro turno», goes on to Inicio.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CierreScreen, useAperturaTurno, useCierreTurno, type PasoCierre } from '@xangarro/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CierreRoute(): ReactElement {
  const router = useRouter();
  const c = useCierreTurno();
  const [paso, setPaso] = useState<PasoCierre>('contar');
  // Dismissed first, or the tabs would open a second time over this route.
  const aInicio = (): void => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/inicio' as never);
  };
  const apertura = useAperturaTurno(aInicio);
  const enResultado = c.state === 'happy' && paso === 'resultado';
  // The header's title is its way back; the steps carry their own heading.
  const titulo = enResultado ? 'Conteo' : 'Mi turno';
  const atras = (): void => {
    if (enResultado) setPaso('contar');
    else router.navigate('/turno' as never);
  };
  return (
    <AppShellWrapper title={titulo} onBack={atras}>
      <CierreScreen
        testID="mobile-cierre"
        state={c.state}
        data={c.data}
        cola={c.cola}
        onCerrar={c.cerrar}
        onRetry={c.refetch}
        onSalir={aInicio}
        onAbrirTurno={apertura.abrir}
        onOtroTurno={apertura.abrirOtro}
        paso={paso}
        onPaso={setPaso}
      />
      {apertura.hoja}
    </AppShellWrapper>
  );
}
