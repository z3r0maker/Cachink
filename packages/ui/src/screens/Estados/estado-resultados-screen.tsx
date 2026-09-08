/**
 * EstadoResultadosScreen — NIF B-3 Estado de Resultados.
 *
 * Restructured with "punchline first":
 *   1. ResumenCard (plain-language summary + Utilidad Neta hero)
 *   2. Rows card (formal NIF B-3 breakdown + HelpAccordions)
 *   3. Waterfall chart (8 bars including Merma)
 *   4. Ingresos donut
 *   5. Egresos donut
 *
 * Pure presentation. ResumenCard and Rows extracted to separate files
 * to respect the 200-line-per-file cap.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { ZERO, type EstadoDeResultados } from '@cachink/domain';
import { Card, HelpAccordion, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { formatChartLabel, moneyToNumber } from '../../charts/chart-tokens';
import { WaterfallChart } from '../../charts/WaterfallChart/index';
import { DonutChart } from '../../charts/DonutChart/index';
import { toWaterfallData, toDonutSlices, toIngresoDonutSlices } from './estado-resultados-mappers';
import { ResumenCard } from './resultados-resumen-card';
import { ResultadosRows } from './resultados-rows';
import type { EgresoPorCategoria } from '../../hooks/use-egresos-por-categoria';
import type { IngresoPorCategoria } from '../../hooks/use-ingresos-por-categoria';
import type { UtilidadNetaTrend } from '../../hooks/use-utilidad-neta-trend';

export interface EstadoResultadosScreenProps {
  readonly estado: EstadoDeResultados | null;
  readonly periodoLabel: string;
  readonly egresosPorCategoria?: readonly EgresoPorCategoria[];
  readonly ingresosPorCategoria?: readonly IngresoPorCategoria[];
  readonly priorEstado?: EstadoDeResultados | null;
  readonly utilidadNetaTrend?: UtilidadNetaTrend | null;
  readonly loading?: boolean;
  readonly testID?: string;
}

function EmptyBody(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="estado-resultados-empty" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.md}
        color={colors.ink}
      >
        {props.title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        marginTop={4}
      >
        {props.body}
      </Text>
    </Card>
  );
}

function IngresosDonutCard(props: {
  data: readonly IngresoPorCategoria[];
  totalIngresos: bigint;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Card padding="md" fullWidth testID="ingresos-por-categoria-card">
      <SectionTitle title={props.t('estados.ingresosPorCategoria')} />
      <HelpAccordion
        subtitle={props.t('estados.ingresosPorCategoriaSubtitle')}
        detail={props.t('estados.ingresosPorCategoriaDetail')}
      />
      <DonutChart
        slices={toIngresoDonutSlices(props.data)}
        centerLabel={props.t('estados.ingresosTotalLabel')}
        centerValue={formatChartLabel(moneyToNumber(props.totalIngresos))}
        formatValue={formatChartLabel}
        testID="ingresos-donut"
      />
    </Card>
  );
}

function EgresosDonutCard(props: {
  data: readonly EgresoPorCategoria[];
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Card padding="md" fullWidth testID="egresos-por-categoria-card">
      <SectionTitle title={props.t('estados.egresosPorCategoria')} />
      <DonutChart
        slices={toDonutSlices(props.data)}
        centerLabel={props.t('estados.egresosTotalLabel')}
        centerValue={formatChartLabel(
          moneyToNumber(props.data.reduce((sum, e) => sum + e.total, 0n)),
        )}
        formatValue={formatChartLabel}
        testID="egresos-donut"
      />
    </Card>
  );
}

export function EstadoResultadosScreen(props: EstadoResultadosScreenProps): ReactElement {
  const { t } = useTranslation();
  const totalIngresos = props.estado?.ingresos ?? ZERO;
  return (
    <View testID={props.testID ?? 'estado-resultados-screen'} gap={14}>
      <SectionTitle title={props.periodoLabel} />
      {props.estado === null ? (
        <EmptyBody title={t('estados.emptyPeriodTitle')} body={t('estados.emptyPeriodBody')} />
      ) : (
        <>
          <ResumenCard
            estado={props.estado}
            priorEstado={props.priorEstado}
            trend={props.utilidadNetaTrend}
            t={t}
          />
          <ResultadosRows estado={props.estado} t={t} />
          <Card padding="md" fullWidth testID="waterfall-card">
            <SectionTitle title={t('estados.chartCascadaLabel')} />
            <WaterfallChart data={toWaterfallData(props.estado, t)} testID="waterfall-chart" />
          </Card>
          {props.ingresosPorCategoria && props.ingresosPorCategoria.length > 0 && (
            <IngresosDonutCard
              data={props.ingresosPorCategoria}
              totalIngresos={totalIngresos}
              t={t}
            />
          )}
          {props.egresosPorCategoria && props.egresosPorCategoria.length > 0 && (
            <EgresosDonutCard data={props.egresosPorCategoria} t={t} />
          )}
        </>
      )}
    </View>
  );
}
