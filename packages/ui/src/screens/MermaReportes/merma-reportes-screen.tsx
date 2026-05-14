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

export function MermaReportesScreen(props: MermaReportesScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const { data: rows, isLoading, error } = useMermaReportes(range.from, range.to);

  const totalUnidades = rows?.reduce((acc, r) => acc + r.totalUnidades, 0) ?? 0;
  const productosAfectados = rows?.length ?? 0;
  const topProducto = rows?.[0]?.productoNombre ?? '—';

  return (
    <ScrollView testID={props.testID ?? 'merma-reportes-screen'}>
      <View padding={16} gap={16}>
        <SectionTitle title={t('mermaReportes.title')} />
        <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />

        <View flexDirection="row" gap={8}>
          <View flex={1}>
            <Kpi label={t('mermaReportes.totalUnidades')} value={String(totalUnidades)} tone="negative" />
          </View>
          <View flex={1}>
            <Kpi label={t('mermaReportes.productosAfectados')} value={String(productosAfectados)} />
          </View>
        </View>
        <Kpi label={t('mermaReportes.productoMasMerma')} value={topProducto} />

        {isLoading && (
          <View gap={8}>
            <Skeleton.Row index={0} testIDPrefix="merma-skeleton" />
            <Skeleton.Row index={1} testIDPrefix="merma-skeleton" />
          </View>
        )}

        {error !== null && !isLoading && (
          <ErrorState
            title={t('common.error')}
            body={error.message}
            testID="merma-error"
          />
        )}

        {rows !== undefined && rows.length === 0 && <EmptyMermaReportes />}

        {rows?.map((row) => (
          <MermaProductoCard
            key={row.productoId as string}
            productoNombre={row.productoNombre}
            totalUnidades={row.totalUnidades}
            movimientos={row.movimientos}
          />
        ))}
      </View>
    </ScrollView>
  );
}
