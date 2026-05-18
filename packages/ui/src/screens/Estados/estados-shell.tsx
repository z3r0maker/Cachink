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
import { IsrDisclaimer } from './isr-disclaimer';
import { InformeMensualAction } from './informe-mensual-action';
import { ActiveBody, nextTab, prevTab } from './estados-active-body';

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
  readonly priorEstado?: EstadoDeResultados | null;
  readonly priorBalance?: BalanceGeneral | null;
  readonly priorFlujo?: FlujoDeEfectivo | null;
  readonly priorIndicadores?: Indicadores | null;
  readonly utilidadNetaTrend?: UtilidadNetaTrend | null;
  readonly isrRate?: number;
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

function useTabLabels(): Record<EstadosSubTab, string> {
  const { t } = useTranslation();
  return {
    resultados: t('estados.tabResultados'),
    balance: t('estados.tabBalance'),
    flujo: t('estados.tabFlujo'),
    indicadores: t('estados.tabIndicadores'),
  };
}

/** gap:18 = 8.3 shadow breathing room (UI-AUDIT-1, Issue 5). */
const SCROLL_CONTENT_STYLE = { gap: 18, padding: 16, paddingBottom: 40 } as const;

function showIsrDisclaimer(tab: EstadosSubTab): boolean {
  return tab === 'resultados' || tab === 'indicadores';
}

function isrIsZeroDueToLoss(props: EstadosShellProps): boolean {
  return (
    props.estado !== null && props.estado.isr === ZERO && props.estado.utilidadOperativa <= ZERO
  );
}

function shouldShowInforme(tab: EstadosSubTab, props: EstadosShellProps): boolean {
  return (
    tab === 'resultados' &&
    (props.showInformeAction ?? true) &&
    props.informeYearMonth !== undefined
  );
}

function ShellContent({
  tab,
  setTab,
  props,
}: {
  tab: EstadosSubTab;
  setTab: (t: EstadosSubTab) => void;
  props: EstadosShellProps;
}): ReactElement {
  return (
    <SwipeableTabView
      onSwipeLeft={() => setTab(nextTab(tab))}
      onSwipeRight={() => setTab(prevTab(tab))}
    >
      <ActiveBody tab={tab} shellProps={props} />
      {showIsrDisclaimer(tab) && (
        <IsrDisclaimer
          onOpenSettings={props.onOpenSettings}
          isrRate={props.isrRate}
          isrIsZeroDueToLoss={isrIsZeroDueToLoss(props)}
        />
      )}
    </SwipeableTabView>
  );
}

export function EstadosShell(props: EstadosShellProps): ReactElement {
  const [tab, setTab] = useState<EstadosSubTab>(props.initialTab ?? 'resultados');
  const labels = useTabLabels();
  const periodLabels = usePeriodLabels();
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
      {shouldShowInforme(tab, props) && (
        <InformeMensualAction
          yearMonth={props.informeYearMonth!}
          businessName={props.businessName}
        />
      )}
      <ShellContent tab={tab} setTab={setTab} props={props} />
    </ScrollView>
  );
}
