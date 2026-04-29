/**
 * EstadosShell — tabbed container for the four Estados Financieros
 * screens (P1C-M8-T01..T05, Slice 3 C19).
 *
 * PeriodPicker lives at the top; below it the active sub-tab renders
 * one of Resultados / Balance / Flujo / Indicadores. State for active
 * tab + picker is kept here; parents only wire the hooks' results.
 */

import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type {
  BalanceGeneral,
  EstadoDeResultados,
  FlujoDeEfectivo,
  Indicadores,
} from '@cachink/domain';
import { PeriodPicker, SegmentedToggle } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
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
  readonly onOpenSettings?: () => void;
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

/**
 * Estados sub-tab bar.
 *
 * Audit M-1 follow-up (UI-AUDIT-1, Issue 1): the legacy hand-rolled row
 * used `<Btn size="sm">` children inside a flex row without `flex={1}`,
 * so each chip sized to its label (RESULTADOS / BALANCE / FLUJO /
 * INDICADORES were four different widths). `SegmentedToggle` already
 * implements equal-flex chip cells with proper radiogroup semantics —
 * delegate to it. Existing E2E selectors (`estados-tabbar`,
 * `estados-tab-{key}`) are preserved via `testID` + `testIDPrefix`.
 */
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
      return <EstadoResultadosScreen estado={p.estado} periodoLabel={p.periodoLabel} />;
    case 'balance':
      return <BalanceGeneralScreen balance={p.balance} periodoLabel={p.periodoLabel} />;
    case 'flujo':
      return <FlujoEfectivoScreen flujo={p.flujo} periodoLabel={p.periodoLabel} />;
    case 'indicadores':
      return <IndicadoresScreen indicadores={p.indicadores} periodoLabel={p.periodoLabel} />;
  }
}

export function EstadosShell(props: EstadosShellProps): ReactElement {
  const { t } = useTranslation();
  const [tab, setTab] = useState<EstadosSubTab>(props.initialTab ?? 'resultados');
  const labels: Record<EstadosSubTab, string> = {
    resultados: t('estados.tabResultados'),
    balance: t('estados.tabBalance'),
    flujo: t('estados.tabFlujo'),
    indicadores: t('estados.tabIndicadores'),
  };
  // Audit M-1 follow-up (UI-AUDIT-1, Issue 5): the previous `gap={14}`
  // was visually consumed by the §8.3 hard 4-px drop shadow on each
  // child Card, leaving the date-label sibling visually flush against
  // the InformeMensualAction card above it. Bumping to 18 restores
  // ~14 px of post-shadow breathing room and resolves the same issue
  // on every Estados sub-tab.
  return (
    <View testID={props.testID ?? 'estados-shell'} gap={18} padding={16}>
      <PeriodPicker
        value={props.periodoState}
        onChange={props.onPeriodoChange}
        labels={{
          mensual: t('estados.periodoMensual'),
          anual: t('estados.periodoAnual'),
          rango: t('estados.periodoRango'),
          mes: t('estados.mesLabel'),
          anio: t('estados.anioLabel'),
          desde: t('estados.fechaDesde'),
          hasta: t('estados.fechaHasta'),
        }}
      />
      <TabBar active={tab} onChange={setTab} labels={labels} />
      {tab === 'resultados' &&
        (props.showInformeAction ?? true) &&
        props.informeYearMonth !== undefined && (
          <InformeMensualAction
            yearMonth={props.informeYearMonth}
            businessName={props.businessName}
          />
        )}
      <ActiveBody tab={tab} props={props} />
      {(tab === 'resultados' || tab === 'indicadores') && (
        <IsrDisclaimer onOpenSettings={props.onOpenSettings} />
      )}
    </View>
  );
}
