/**
 * Expo Router entry for /gastos (Track M, M-08; board MvGastos): the turno's
 * gastos, registering one and paying a due recurrente. `?recurrente=<id>`
 * — Inicio's «Para hoy» — opens the pagar sheet prefilled. A stack route
 * opened from Inicio's atajo, so it wears the frame with the way back. With
 * no open turno, «Abrir turno» opens the fondo sheet here (RvGastos, M8).
 */

import type { ReactElement } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GastosScreen, useAperturaTurno, useGastos, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

export default function GastosRoute(): ReactElement {
  const { t } = useTranslation();
  const back = useBackTo('/inicio');
  const g = useGastos();
  const apertura = useAperturaTurno();
  const { recurrente } = useLocalSearchParams<{ recurrente?: string }>();
  const prefill = recurrente
    ? (g.porPagar?.find((p) => p.para.id === recurrente)?.prefill ?? null)
    : null;
  return (
    <AppShellWrapper title={t('shell.nav.gastos')} onBack={back}>
      <GastosScreen
        testID="mobile-gastos"
        state={g.state}
        data={g.data}
        turnoAbierto={g.turnoAbierto}
        onAbrirTurno={apertura.abrir}
        porPagar={g.porPagar}
        prefill={prefill}
        registrar={g.registrar}
        onRetry={g.refetch}
      />
      {apertura.hoja}
    </AppShellWrapper>
  );
}
