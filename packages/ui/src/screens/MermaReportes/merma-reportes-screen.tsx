/**
 * MermaReportesScreen — read-only report of merma (shrinkage) by product
 * and period. Shows KPIs at the top and a list of affected products
 * ordered by highest merma.
 *
 * Part C1 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { ErrorState, Kpi, PeriodPicker, SectionTitle, Skeleton } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { useMermaReportes } from '../../hooks/use-merma-reportes';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { EmptyMermaReportes } from './empty-merma-reportes';
import { MermaProductoCard } from './merma-producto-card';

export interface MermaReportesScreenProps {
  readonly testID?: string;
}

type MermaRow = NonNullable<ReturnType<typeof useMermaReportes>['data']>[number];

function MermaKpiStrip(props: { rows: readonly MermaRow[] | undefined; t: ReturnType<typeof useTranslation>['t'] }): ReactElement {
  const total = props.rows?.reduce((acc, r) => acc + r.totalUnidades, 0) ?? 0;
  const affected = props.rows?.length ?? 0;
  const top = props.rows?.[0]?.productoNombre ?? '—';
  return (
    <>
      <View flexDirection="row" gap={8}>
        <View flex={1}><Kpi label={props.t('mermaReportes.totalUnidades')} value={String(total)} tone="negative" /></View>
        <View flex={1}><Kpi label={props.t('mermaReportes.productosAfectados')} value={String(affected)} /></View>
      </View>
      <Kpi label={props.t('mermaReportes.productoMasMerma')} value={top} />
    </>
  );
}

function MermaDataState(props: {
  rows: readonly MermaRow[] | undefined;
  isLoading: boolean;
  error: Error | null;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement | null {
  if (props.isLoading) {
    return (
      <View gap={8}>
        <Skeleton.Row index={0} testIDPrefix="merma-skeleton" />
        <Skeleton.Row index={1} testIDPrefix="merma-skeleton" />
      </View>
    );
  }
  if (props.error !== null) return <ErrorState title={props.t('common.error')} body={props.error.message} testID="merma-error" />;
  if (props.rows !== undefined && props.rows.length === 0) return <EmptyMermaReportes />;
  return null;
}

export function MermaReportesScreen(props: MermaReportesScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const { data: rows, isLoading, error } = useMermaReportes(range.from, range.to);

  return (
    <ScrollView testID={props.testID ?? 'merma-reportes-screen'}>
      <View padding={16} gap={16}>
        <SectionTitle title={t('mermaReportes.title')} />
        <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />
        <MermaKpiStrip rows={rows} t={t} />
        <MermaDataState rows={rows} isLoading={isLoading} error={error} t={t} />
        {rows?.map((row) => (
          <MermaProductoCard key={row.productoId as string} productoNombre={row.productoNombre} totalUnidades={row.totalUnidades} movimientos={row.movimientos} />
        ))}
      </View>
    </ScrollView>
  );
}
