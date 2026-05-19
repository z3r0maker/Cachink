import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  Card,
  DeltaIndicator,
  Gauge,
  HelpAccordion,
  HealthIndicator,
  Kpi,
} from '../../components/index';
import type { GaugeTone } from '../../components/index';
import { Sparkline } from '../../charts/Sparkline/index';
import { colors } from '../../theme';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

export function marginTone(value: number | null): GaugeTone {
  if (value === null) return 'neutral';
  if (value < 0) return 'negative';
  if (value < 0.1) return 'warning';
  return 'positive';
}

function percentValue(v: number | null): number {
  if (v === null) return 0;
  const pct = Math.round(v * 100);
  return Math.max(-100, Math.min(100, pct));
}

function formatMarginPercent(v: number | null): string {
  if (v === null) return '—';
  const raw = Math.round(v * 100);
  if (raw < -100) return '< -100%';
  if (raw > 100) return '> 100%';
  return `${raw}%`;
}

export interface MarginCardProps {
  readonly label: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly value: number | null;
  readonly trend?: readonly number[];
  readonly zones: readonly { from: number; to: number; color: string }[];
  readonly healthVerdict: string | null;
  readonly priorValue?: number | null;
  readonly healthTone: 'healthy' | 'warning' | 'critical' | null;
  readonly testID: string;
  readonly t: T;
}

function MarginCardGauge(props: Pick<MarginCardProps, 'value' | 'label' | 'zones'>): ReactElement {
  return (
    <Gauge
      value={percentValue(props.value)} max={100} label={props.label}
      tone={marginTone(props.value)} origin="center" showValue
      valueFormatter={() => formatMarginPercent(props.value)} zones={props.zones}
    />
  );
}

export function MarginCard(props: MarginCardProps): ReactElement {
  return (
    <Card testID={props.testID} padding="md" fullWidth>
      <MarginCardGauge value={props.value} label={props.label} zones={props.zones} />
      <HelpAccordion subtitle={props.subtitle} detail={props.detail} />
      {props.healthVerdict !== null && props.healthTone !== null && (
        <HealthIndicator tone={props.healthTone} verdict={props.healthVerdict} />
      )}
      {props.priorValue != null && props.value !== null && (
        <DeltaIndicator current={props.value} previous={props.priorValue} format="percent" periodLabel={props.t('estados.deltaVsMesAnterior')} />
      )}
      {props.trend !== undefined && props.trend.length >= 2 && (
        <View marginTop={8}>
          <Sparkline points={props.trend.map((v) => v * 100)} color={marginTone(props.value) === 'positive' ? colors.green : colors.red} height={40} testID={`${props.testID}-sparkline`} />
        </View>
      )}
    </Card>
  );
}

export function NumericCard(props: {
  label: string;
  subtitle: string;
  detail: string;
  value: number | null;
  formatter: (v: number) => string;
  healthVerdict: string | null;
  healthTone: 'healthy' | 'warning' | 'critical' | null;
  priorValue?: number | null;
  testID: string;
  nanLabel: string;
  t: T;
}): ReactElement {
  return (
    <Card testID={props.testID} padding="md" fullWidth>
      <Kpi label={props.label} value={props.value === null ? props.nanLabel : props.formatter(props.value)} tone={props.value === null ? 'neutral' : 'positive'} />
      <HelpAccordion subtitle={props.subtitle} detail={props.detail} />
      {props.healthVerdict !== null && props.healthTone !== null && (
        <HealthIndicator tone={props.healthTone} verdict={props.healthVerdict} />
      )}
      {props.priorValue != null && props.value !== null && (
        <DeltaIndicator current={props.value} previous={props.priorValue} format="number" periodLabel={props.t('estados.deltaVsMesAnterior')} />
      )}
    </Card>
  );
}
