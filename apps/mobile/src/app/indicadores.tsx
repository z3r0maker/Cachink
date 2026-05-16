/**
 * Expo Router entry for /indicadores — KPI dashboard.
 *
 * Mounts EstadosShell with `initialTab="indicadores"` so the user
 * lands directly on the Indicadores sub-tab. Reached from the
 * Director "Otros" grid shortcut.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { formatPeriodoLabel } from '@cachink/domain';
import {
  EstadosShell,
  defaultPeriodoState,
  useIndicadores,
  useIndicadoresTrend,
  usePeriodoRange,
  type PeriodoState,
} from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function IndicadoresRoute(): ReactElement {
  const router = useRouter();
  const [periodoState, setPeriodoState] = useState<PeriodoState>(() => defaultPeriodoState());
  const periodo = usePeriodoRange(periodoState);
  const periodoLabel = formatPeriodoLabel(periodo.from, periodo.to);

  const indicadores = useIndicadores({ periodo });
  const trend = useIndicadoresTrend({ periodo });

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <EstadosShell
        initialTab="indicadores"
        periodoState={periodoState}
        onPeriodoChange={setPeriodoState}
        periodoLabel={periodoLabel}
        estado={null}
        balance={null}
        flujo={null}
        indicadores={indicadores.data ?? null}
        trend={trend.data ?? null}
        onOpenSettings={() => router.push('/settings' as never)}
      />
    </AppShellWrapper>
  );
}
