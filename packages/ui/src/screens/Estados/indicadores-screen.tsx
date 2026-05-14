/**
 * IndicadoresScreen — KPIs + Gauges dashboard (P1C-M8-T05, Slice 3 C17).
 *
 * Renders six indicators:
 *   - Margen bruto / operativo / neto   — percent Gauges, tone by sign.
 *   - Razón de liquidez                  — Kpi (number, dimensionless).
 *   - Rotación de inventario             — Kpi (turns per period).
 *   - Días promedio de cobranza          — Kpi (days).
 *
 * `null` values from the calc render as "—" (plain Kpi with the
 * `indicadorNaN` label); the plan risk #3 covers this — negative
 * denominator ⇒ no ratio.
 *
 * Pure presentation.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Indicadores } from '@cachink/domain';
import { Card, Gauge, Kpi, SectionTitle } from '../../components/index';
import type { GaugeTone } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { Sparkline } from '../../charts/Sparkline/index';
import { colors } from '../../theme';
import type { MarginTrend } from '../../hooks/use-indicadores-trend';

export interface IndicadoresScreenProps {
  readonly indicadores: Indicadores | null;
  readonly periodoLabel: string;
  readonly trend?: MarginTrend | null;
  readonly testID?: string;
}

function marginTone(value: number | null): GaugeTone {
  if (value === null) return 'neutral';
  if (value < 0) return 'negative';
  if (value < 0.1) return 'warning';
  return 'positive';
}

function percentValue(value: number | null): number {
  if (value === null) return 0;
  return Math.round(value * 100);
}

function MarginGauge({
  label,
  value,
  trend,
  testID,
}: {
  label: string;
  value: number | null;
  trend?: readonly number[];
  testID: string;
}): ReactElement {
  return (
    <Card testID={testID} padding="md" fullWidth>
      <Gauge
        value={percentValue(value)}
        max={100}
        label={label}
        tone={marginTone(value)}
        showValue
        valueFormatter={(v) => (value === null ? '—' : `${v}%`)}
      />
      {trend !== undefined && trend.length >= 2 && (
        <View marginTop={8}>
          <Sparkline
            points={trend.map((v) => v * 100)}
            color={marginTone(value) === 'positive' ? colors.green : colors.red}
            height={28}
            testID={`${testID}-sparkline`}
          />
        </View>
      )}
    </Card>
  );
}

function NumericKpi({
  label,
  value,
  formatter,
  testID,
  nanLabel,
}: {
  label: string;
  value: number | null;
  formatter: (v: number) => string;
  testID: string;
  nanLabel: string;
}): ReactElement {
  return (
    <Card testID={testID} padding="md" fullWidth>
      <Kpi
        label={label}
        value={value === null ? nanLabel : formatter(value)}
        tone={value === null ? 'neutral' : 'positive'}
      />
    </Card>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

function MarginsSection({
  indicadores,
  trend,
  t,
}: {
  indicadores: Indicadores | null;
  trend?: MarginTrend | null;
  t: T;
}): ReactElement {
  return (
    <>
      <MarginGauge
        label={t('estados.indicadoresMargenBruto')}
        value={indicadores?.margenBruto ?? null}
        trend={trend?.margenBruto}
        testID="indicador-margen-bruto"
      />
      <MarginGauge
        label={t('estados.indicadoresMargenOperativo')}
        value={indicadores?.margenOperativo ?? null}
        trend={trend?.margenOperativo}
        testID="indicador-margen-operativo"
      />
      <MarginGauge
        label={t('estados.indicadoresMargenNeto')}
        value={indicadores?.margenNeto ?? null}
        trend={trend?.margenNeto}
        testID="indicador-margen-neto"
      />
    </>
  );
}

function NumericSection({
  indicadores,
  t,
  nanLabel,
}: {
  indicadores: Indicadores | null;
  t: T;
  nanLabel: string;
}): ReactElement {
  return (
    <>
      <NumericKpi
        label={t('estados.indicadoresLiquidez')}
        value={indicadores?.razonDeLiquidez ?? null}
        formatter={(v) => v.toFixed(2)}
        nanLabel={nanLabel}
        testID="indicador-liquidez"
      />
      <NumericKpi
        label={t('estados.indicadoresRotacion')}
        value={indicadores?.rotacionInventario ?? null}
        formatter={(v) => v.toFixed(2)}
        nanLabel={nanLabel}
        testID="indicador-rotacion"
      />
      <NumericKpi
        label={t('estados.indicadoresDiasCobranza')}
        value={indicadores?.diasPromedioCobranza ?? null}
        formatter={(v) => Math.round(v).toString()}
        nanLabel={nanLabel}
        testID="indicador-dias-cobranza"
      />
    </>
  );
}

export function IndicadoresScreen(props: IndicadoresScreenProps): ReactElement {
  const { t } = useTranslation();
  const nanLabel = t('estados.indicadorNaN');
  return (
    <View testID={props.testID ?? 'indicadores-screen'} gap={12}>
      <SectionTitle title={props.periodoLabel} />
      <MarginsSection indicadores={props.indicadores} trend={props.trend} t={t} />
      <NumericSection indicadores={props.indicadores} t={t} nanLabel={nanLabel} />
    </View>
  );
}
