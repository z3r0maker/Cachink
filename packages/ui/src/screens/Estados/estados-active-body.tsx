/** ActiveBody — renders the active sub-tab of EstadosShell. */

import type { ReactElement } from 'react';
import type { EstadosSubTab, EstadosShellProps } from './estados-shell';
import { BalanceGeneralScreen } from './balance-general-screen';
import { EstadoResultadosScreen } from './estado-resultados-screen';
import { FlujoEfectivoScreen } from './flujo-efectivo-screen';
import { IndicadoresScreen } from './indicadores-screen';

function ResultadosBody(p: EstadosShellProps): ReactElement {
  return (
    <EstadoResultadosScreen
      estado={p.estado}
      periodoLabel={p.periodoLabel}
      egresosPorCategoria={p.egresosPorCategoria}
      ingresosPorCategoria={p.ingresosPorCategoria}
      priorEstado={p.priorEstado}
      utilidadNetaTrend={p.utilidadNetaTrend}
    />
  );
}

function IndicadoresBody(p: EstadosShellProps): ReactElement {
  return (
    <IndicadoresScreen
      indicadores={p.indicadores}
      periodoLabel={p.periodoLabel}
      periodoMode={p.periodoState.mode}
      trend={p.trend}
      priorIndicadores={p.priorIndicadores}
      onOpenSettings={p.onOpenSettings}
    />
  );
}

export function ActiveBody({
  tab,
  shellProps,
}: {
  tab: EstadosSubTab;
  shellProps: EstadosShellProps;
}): ReactElement {
  switch (tab) {
    case 'resultados':
      return <ResultadosBody {...shellProps} />;
    case 'balance':
      return (
        <BalanceGeneralScreen
          balance={shellProps.balance}
          periodoLabel={shellProps.periodoLabel}
          priorBalance={shellProps.priorBalance}
        />
      );
    case 'flujo':
      return (
        <FlujoEfectivoScreen
          flujo={shellProps.flujo}
          periodoLabel={shellProps.periodoLabel}
          priorFlujo={shellProps.priorFlujo}
        />
      );
    case 'indicadores':
      return <IndicadoresBody {...shellProps} />;
  }
}

const TAB_ORDER: readonly EstadosSubTab[] = ['resultados', 'balance', 'flujo', 'indicadores'];

export function nextTab(current: EstadosSubTab): EstadosSubTab {
  const idx = TAB_ORDER.indexOf(current);
  return TAB_ORDER[Math.min(idx + 1, TAB_ORDER.length - 1)]!;
}

export function prevTab(current: EstadosSubTab): EstadosSubTab {
  const idx = TAB_ORDER.indexOf(current);
  return TAB_ORDER[Math.max(idx - 1, 0)]!;
}
