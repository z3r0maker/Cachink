/**
 * CajaReportesScreen — read-only report of cash drawer turns by period.
 * Shows KPIs (total turns, turns with discrepancy, average discrepancy)
 * and a list of turns ordered newest-first.
 *
 * Part C2 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import { ErrorState, Kpi, PeriodPicker, SectionTitle, Skeleton } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { useCajaHistorial } from '../../hooks/use-caja-historial';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { EmptyCajaReportes } from './empty-caja-reportes';
import { CajaTurnoCard } from './caja-turno-card';

export interface CajaReportesScreenProps {
  readonly testID?: string;
}

export function CajaReportesScreen(props: CajaReportesScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const { data: turnos, isLoading, error } = useCajaHistorial(range.from, range.to);

  const totalTurnos = turnos?.length ?? 0;
  const turnosConDiferencia =
    turnos?.filter(
      (tn) => tn.diferenciaCentavos !== null && tn.diferenciaCentavos !== 0n,
    ).length ?? 0;

  const promedioDiferencia = (() => {
    if (!turnos || turnos.length === 0) return 0n;
    const closed = turnos.filter((tn) => tn.diferenciaCentavos !== null);
    if (closed.length === 0) return 0n;
    const sum = closed.reduce(
      (acc, tn) => acc + (tn.diferenciaCentavos ?? 0n),
      0n,
    );
    return sum / BigInt(closed.length);
  })();

  return (
    <ScrollView testID={props.testID ?? 'caja-reportes-screen'}>
      <View padding={16} gap={16}>
        <SectionTitle title={t('cajaReportes.title')} />
        <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />

        <View flexDirection="row" gap={8}>
          <View flex={1}>
            <Kpi label={t('cajaReportes.totalTurnos')} value={String(totalTurnos)} />
          </View>
          <View flex={1}>
            <Kpi
              label={t('cajaReportes.totalDiscrepancias')}
              value={String(turnosConDiferencia)}
              tone={turnosConDiferencia > 0 ? 'negative' : 'neutral'}
            />
          </View>
        </View>
        <Kpi
          label={t('cajaReportes.promedioDiferencia')}
          value={formatMoney(promedioDiferencia)}
          tone={promedioDiferencia < 0n ? 'negative' : 'neutral'}
        />

        {isLoading && (
          <View gap={8}>
            <Skeleton.Row index={0} testIDPrefix="caja-skeleton" />
            <Skeleton.Row index={1} testIDPrefix="caja-skeleton" />
          </View>
        )}

        {error !== null && !isLoading && (
          <ErrorState
            title={t('common.error')}
            body={error.message}
            testID="caja-error"
          />
        )}

        {turnos !== undefined && turnos.length === 0 && <EmptyCajaReportes />}

        {turnos?.map((turno) => (
          <CajaTurnoCard key={turno.id} turno={turno} />
        ))}
      </View>
    </ScrollView>
  );
}
