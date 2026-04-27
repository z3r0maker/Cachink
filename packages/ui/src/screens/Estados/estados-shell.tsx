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
import { Btn, PeriodPicker } from '../../components/index';
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

function TabBar(props: TabBarProps): ReactElement {
  const tabs: readonly EstadosSubTab[] = ['resultados', 'balance', 'flujo', 'indicadores'];
  return (
    <View flexDirection="row" gap={8} testID="estados-tabbar">
      {tabs.map((tab) => (
        <Btn
          key={tab}
          variant={props.active === tab ? 'dark' : 'ghost'}
          size="sm"
          onPress={() => props.onChange(tab)}
          testID={`estados-tab-${tab}`}
        >
          {props.labels[tab]}
        </Btn>
      ))}
    </View>
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
  return (
    <View testID={props.testID ?? 'estados-shell'} gap={14} padding={16}>
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
