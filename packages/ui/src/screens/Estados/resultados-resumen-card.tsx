/**
 * ResumenCard — punchline summary for the Estado de Resultados.
 *
 * Shows a plain-language sentence, Utilidad Neta hero, health verdict,
 * delta indicator, and 6-month sparkline trend.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { ZERO, formatMoney, type EstadoDeResultados } from '@cachink/domain';
import { Card, DeltaIndicator, HealthIndicator, Kpi, SectionTitle } from '../../components/index';
import { colors, typography } from '../../theme';
import { moneyToNumber } from '../../charts/chart-tokens';
import { Sparkline } from '../../charts/Sparkline/index';
import { utilidadNetaVerdict } from './health-verdicts';
import type { UtilidadNetaTrend } from '../../hooks/use-utilidad-neta-trend';
import type { TranslateFunction as T } from '../../i18n/index';

export interface ResumenCardProps {
  readonly estado: EstadoDeResultados;
  readonly priorEstado?: EstadoDeResultados | null;
  readonly trend?: UtilidadNetaTrend | null;
  readonly t: T;
}

function UtilidadHero(props: {
  estado: EstadoDeResultados;
  priorEstado?: EstadoDeResultados | null;
  trend?: UtilidadNetaTrend | null;
  t: T;
}): ReactElement {
  const { estado, t } = props;
  const verdict = utilidadNetaVerdict(estado.utilidadNeta, t);
  const tone: 'positive' | 'negative' = estado.utilidadNeta >= ZERO ? 'positive' : 'negative';
  const accentColor = tone === 'negative' ? colors.red : colors.green;
  return (
    <View
      testID="estado-utilidad-neta-card" borderLeftWidth={4} borderLeftColor={accentColor}
      borderRadius={12} overflow="hidden" padding={12}
      backgroundColor={tone === 'negative' ? colors.redSoft : colors.greenSoft}
    >
      <Kpi value={formatMoney(estado.utilidadNeta)} label={t('estados.resultadosUtilidadNeta')} tone={tone} align="right" testID="estado-utilidad-neta-hero" />
      <HealthIndicator tone={verdict.tone} verdict={verdict.verdict} testID="estado-resumen-health" />
      {props.priorEstado != null && (
        <DeltaIndicator current={moneyToNumber(estado.utilidadNeta)} previous={moneyToNumber(props.priorEstado.utilidadNeta)} format="percent" periodLabel={t('estados.deltaVsMesAnterior')} testID="estado-resumen-delta" />
      )}
      {props.trend != null && props.trend.points.length >= 2 && (
        <View marginTop={8}>
          <Sparkline points={props.trend.points} color={accentColor} height={28} testID="estado-resumen-sparkline" />
        </View>
      )}
    </View>
  );
}

export function ResumenCard(props: ResumenCardProps): ReactElement {
  const { estado, t } = props;
  const sentence = t('estados.resultadosResumenSentence', {
    ingresos: formatMoney(estado.ingresos),
    egresos: formatMoney(estado.costoDeVentas + estado.gastosOperativos + estado.merma),
    neto: formatMoney(estado.utilidadNeta),
  });
  return (
    <Card testID="estado-resumen-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.resultadosResumenTitle')} />
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={14} color={colors.ink} marginTop={4} marginBottom={12}>
        {sentence}
      </Text>
      <UtilidadHero estado={estado} priorEstado={props.priorEstado} trend={props.trend} t={t} />
    </Card>
  );
}
