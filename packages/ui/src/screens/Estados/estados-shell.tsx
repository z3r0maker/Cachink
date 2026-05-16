/**
 * EstadosShell — tabbed container for the four Estados Financieros
 * screens (P1C-M8-T01..T05, Slice 3 C19).
 *
 * PeriodPicker lives at the top; below it the active sub-tab renders
 * one of Resultados / Balance / Flujo / Indicadores. State for active
 * tab + picker is kept here; parents only wire the hooks' results.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import {
  ZERO,
  type BalanceGeneral,
  type EstadoDeResultados,
  type FlujoDeEfectivo,
  type Indicadores,
} from '@cachink/domain';
import type { EgresoPorCategoria } from '../../hooks/use-egresos-por-categoria';
import type { IngresoPorCategoria } from '../../hooks/use-ingresos-por-categoria';
import type { MarginTrend } from '../../hooks/use-indicadores-trend';
import type { UtilidadNetaTrend } from '../../hooks/use-utilidad-neta-trend';
import { PeriodPicker, SegmentedToggle, SwipeableTabView } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { BalanceGeneralScreen } from './balance-general-screen';
import { EstadoResultadosScreen } from './estado-resultados-screen';
import { FlujoEfectivoScreen } from './flujo-efectivo-screen';
import { IndicadoresScreen } from './indicadores-screen';
import { IsrDisclaimer } from './isr-disclaimer';
import { InformeMensualAction } from './informe-mensual-action';

export type EstadosSubTab = 'resultados' | 'balance' | 'flujo' | 'indicadores';

export interface EstadosShellProps {
  readonly initialTab?: EstadosSubTab;
  readonly periodoState: PeriodoState;
  readonly onPeriodoChange: (next: PeriodoState) => void;
  readonly periodoLabel: string;
  readonly estado: EstadoDeResultados | null;
  readonly balance: BalanceGeneral | null;
  readonly flujo: FlujoDeEfectivo | null;
  readonly indicadores: Indicadores | null;
  readonly egresosPorCategoria?: readonly EgresoPorCategoria[];
  readonly ingresosPorCategoria?: readonly IngresoPorCategoria[];
  readonly trend?: MarginTrend | null;
  readonly onOpenSettings?: () => void;
  /** Prior-period data for delta comparisons. */
  readonly priorEstado?: EstadoDeResultados | null;
  readonly priorBalance?: BalanceGeneral | null;
  readonly priorFlujo?: FlujoDeEfectivo | null;
  readonly priorIndicadores?: Indicadores | null;
  /** 6-month Utilidad Neta trend for the Resultados sparkline. */
  readonly utilidadNetaTrend?: UtilidadNetaTrend | null;
  /** ISR rate as a decimal (e.g. 0.30). Passed through to IsrDisclaimer. */
  readonly isrRate?: number;
  /** YYYY-MM string for the Informe mensual action. Omit to hide. */
  readonly informeYearMonth?: string;
  readonly businessName?: string;
  readonly showInformeAction?: boolean;
  readonly testID?: string;
}

interface TabBarProps {
  readonly active: EstadosSubTab;
  readonly onChange: (tab: EstadosSubTab) => void;
  readonly labels: Record<EstadosSubTab, string>;
}

function TabBar(props: TabBarProps): ReactElement {
  return (
    <SegmentedToggle<EstadosSubTab>
      testID="estados-tabbar"
      testIDPrefix="estados-tab"
      value={props.active}
      options={[
        { key: 'resultados', label: props.labels.resultados },
        { key: 'balance', label: props.labels.balance },
        { key: 'flujo', label: props.labels.flujo },
        { key: 'indicadores', label: props.labels.indicadores },
      ]}
      onChange={props.onChange}
    />
  );
}

function ActiveBody(props: { tab: EstadosSubTab; props: EstadosShellProps }): ReactElement {
  const p = props.props;
  switch (props.tab) {
    case 'resultados':
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
    case 'balance':
      return (
        <BalanceGeneralScreen
          balance={p.balance}
          periodoLabel={p.periodoLabel}
          priorBalance={p.priorBalance}
        />
      );
    case 'flujo':
      return (
        <FlujoEfectivoScreen
          flujo={p.flujo}
          periodoLabel={p.periodoLabel}
          priorFlujo={p.priorFlujo}
        />
      );
    case 'indicadores':
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
}

const TAB_ORDER: readonly EstadosSubTab[] = ['resultados', 'balance', 'flujo', 'indicadores'];

function nextTab(current: EstadosSubTab): EstadosSubTab {
  const idx = TAB_ORDER.indexOf(current);
  return TAB_ORDER[Math.min(idx + 1, TAB_ORDER.length - 1)]!;
}

function prevTab(current: EstadosSubTab): EstadosSubTab {
  const idx = TAB_ORDER.indexOf(current);
  return TAB_ORDER[Math.max(idx - 1, 0)]!;
}

function useTabLabels(): Record<EstadosSubTab, string> {
  const { t } = useTranslation();
  return {
    resultados: t('estados.tabResultados'),
    balance: t('estados.tabBalance'),
    flujo: t('estados.tabFlujo'),
    indicadores: t('estados.tabIndicadores'),
  };
}

/** gap:18 = §8.3 shadow breathing room (UI-AUDIT-1, Issue 5). */
const SCROLL_CONTENT_STYLE = { gap: 18, padding: 16, paddingBottom: 40 } as const;

export function EstadosShell(props: EstadosShellProps): ReactElement {
  const [tab, setTab] = useState<EstadosSubTab>(props.initialTab ?? 'resultados');
  const labels = useTabLabels();
  const periodLabels = usePeriodLabels();
  const showInforme =
    tab === 'resultados' &&
    (props.showInformeAction ?? true) &&
    props.informeYearMonth !== undefined;
  return (
    <ScrollView
      testID={props.testID ?? 'estados-shell'}
      style={{ flex: 1 }}
      contentContainerStyle={SCROLL_CONTENT_STYLE}
    >
      <PeriodPicker
        value={props.periodoState}
        onChange={props.onPeriodoChange}
        labels={periodLabels}
      />
      <TabBar active={tab} onChange={setTab} labels={labels} />
      {showInforme && (
        <InformeMensualAction
          yearMonth={props.informeYearMonth!}
          businessName={props.businessName}
        />
      )}
      <SwipeableTabView
        onSwipeLeft={() => setTab(nextTab(tab))}
        onSwipeRight={() => setTab(prevTab(tab))}
      >
        <ActiveBody tab={tab} props={props} />
        {(tab === 'resultados' || tab === 'indicadores') && (
          <IsrDisclaimer
            onOpenSettings={props.onOpenSettings}
            isrRate={props.isrRate}
            isrIsZeroDueToLoss={
              props.estado !== null &&
              props.estado.isr === ZERO &&
              props.estado.utilidadOperativa <= ZERO
            }
          />
        )}
      </SwipeableTabView>
    </ScrollView>
  );
}
