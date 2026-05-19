/**
 * CajaReportesScreen — read-only report of cash drawer turns by period.
 * Shows KPIs (total turns, turns with discrepancy, average discrepancy)
 * and a list of turns ordered newest-first.
 *
 * Part C2 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView, View as RNView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import type { CajaTurno } from '@cachink/domain';
import { ErrorState, Kpi, PeriodPicker, SectionTitle, Skeleton } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { useCajaHistorial } from '../../hooks/use-caja-historial';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { EmptyCajaReportes } from './empty-caja-reportes';
import { CajaTurnoCard } from './caja-turno-card';
import { computeReportKpis } from './compute-report-kpis';

export interface CajaReportesScreenProps {
  readonly testID?: string;
}

export function CajaReportesScreen(props: CajaReportesScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const { data: turnos, isLoading, error } = useCajaHistorial(range.from, range.to);
  const kpis = computeReportKpis(turnos ?? []);

  return (
    <RNView testID={props.testID ?? 'caja-reportes-screen'} style={{ flex: 1 }}>
      <ScrollView>
        <View padding={16} gap={16}>
          <SectionTitle title={t('cajaReportes.title')} />
          <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />
          <ReportKpis kpis={kpis} t={t} />
          <ReportStateView turnos={turnos} isLoading={isLoading} error={error} t={t} />
          {turnos?.map((turno) => (
            <CajaTurnoCard key={turno.id} turno={turno} />
          ))}
        </View>
      </ScrollView>
    </RNView>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

interface KpiData {
  totalTurnos: number;
  turnosConDiferencia: number;
  promedioDiferencia: bigint;
}

function ReportKpis(props: { kpis: KpiData; t: T }): ReactElement {
  return (
    <View gap={8}>
      <View flexDirection="row" gap={8}>
        <View flex={1}>
          <Kpi label={props.t('cajaReportes.totalTurnos')} value={String(props.kpis.totalTurnos)} />
        </View>
        <View flex={1}>
          <Kpi
            label={props.t('cajaReportes.totalDiscrepancias')}
            value={String(props.kpis.turnosConDiferencia)}
            tone={props.kpis.turnosConDiferencia > 0 ? 'negative' : 'neutral'}
          />
        </View>
      </View>
      <Kpi
        label={props.t('cajaReportes.promedioDiferencia')}
        value={formatMoney(props.kpis.promedioDiferencia)}
        tone={props.kpis.promedioDiferencia < 0n ? 'negative' : 'neutral'}
      />
    </View>
  );
}

function ReportStateView(props: {
  turnos: readonly CajaTurno[] | undefined;
  isLoading: boolean;
  error: Error | null;
  t: T;
}): ReactElement | null {
  if (props.isLoading) {
    return (
      <View gap={8}>
        <Skeleton.Row index={0} testIDPrefix="caja-skeleton" />
        <Skeleton.Row index={1} testIDPrefix="caja-skeleton" />
      </View>
    );
  }
  if (props.error !== null) {
    return (
      <ErrorState title={props.t('common.error')} body={props.error.message} testID="caja-error" />
    );
  }
  if (props.turnos !== undefined && props.turnos.length === 0) {
    return <EmptyCajaReportes />;
  }
  return null;
}
