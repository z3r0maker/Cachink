/**
 * IndicadoresScreen — KPIs + Gauges dashboard.
 *
 * Themed sections: margin gauges (rentabilidad) + numeric KPIs (salud)
 * + threshold disclosure card. Each KPI has: HelpAccordion,
 * HealthIndicator, DeltaIndicator, and (for margins) zone overlays.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { DEFAULT_HEALTH_THRESHOLDS, evaluateHealth, type HealthThresholds, type Indicadores } from '@cachink/domain';
import {
  Card,
  DeltaIndicator,
  Gauge,
  HelpAccordion,
  HealthIndicator,
  Kpi,
  SectionTitle,
} from '../../components/index';
import type { GaugeTone } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { Sparkline } from '../../charts/Sparkline/index';
import { colors } from '../../theme';
import type { MarginTrend } from '../../hooks/use-indicadores-trend';

export interface IndicadoresScreenProps {
  readonly indicadores: Indicadores | null;
  readonly periodoLabel: string;
  readonly periodoMode?: 'mensual' | 'anual' | 'rango';
  readonly trend?: MarginTrend | null;
  readonly priorIndicadores?: Indicadores | null;
  readonly onOpenSettings?: () => void;
  /** Custom thresholds from Settings. Falls back to defaults when absent. */
  readonly thresholds?: HealthThresholds;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function marginTone(value: number | null): GaugeTone {
  if (value === null) return 'neutral';
  if (value < 0) return 'negative';
  if (value < 0.1) return 'warning';
  return 'positive';
}

function percentValue(v: number | null): number {
  if (v === null) return 0;
  const pct = Math.round(v * 100);
  // Cap at [-100, 100] for display — extreme values add no info.
  return Math.max(-100, Math.min(100, pct));
}

function formatMarginPercent(v: number | null): string {
  if (v === null) return '—';
  const raw = Math.round(v * 100);
  if (raw < -100) return '< -100%';
  if (raw > 100) return '> 100%';
  return `${raw}%`;
}

const MARGIN_ZONES = {
  bruto: [
    { from: 0, to: 10, color: colors.redSoft },
    { from: 10, to: 20, color: colors.warningSoft },
    { from: 20, to: 100, color: colors.greenSoft },
  ],
  operativo: [
    { from: 0, to: 5, color: colors.redSoft },
    { from: 5, to: 10, color: colors.warningSoft },
    { from: 10, to: 100, color: colors.greenSoft },
  ],
  neto: [
    { from: 0, to: 3, color: colors.redSoft },
    { from: 3, to: 8, color: colors.warningSoft },
    { from: 8, to: 100, color: colors.greenSoft },
  ],
} as const;

function MarginCard(props: {
  label: string;
  subtitle: string;
  detail: string;
  value: number | null;
  trend?: readonly number[];
  zones: readonly { from: number; to: number; color: string }[];
  healthVerdict: string | null;
  priorValue?: number | null;
  healthTone: 'healthy' | 'warning' | 'critical' | null;
  testID: string;
  t: T;
}): ReactElement {
  const tone = props.healthTone;
  return (
    <Card testID={props.testID} padding="md" fullWidth>
      <Gauge
        value={percentValue(props.value)}
        max={100}
        label={props.label}
        tone={marginTone(props.value)}
        origin="center"
        showValue
        valueFormatter={() => formatMarginPercent(props.value)}
        zones={props.zones}
      />
      <HelpAccordion subtitle={props.subtitle} detail={props.detail} />
      {props.healthVerdict !== null && tone !== null && (
        <HealthIndicator tone={tone} verdict={props.healthVerdict} />
      )}
      {props.priorValue !== undefined && props.priorValue !== null && props.value !== null && (
        <DeltaIndicator
          current={props.value}
          previous={props.priorValue}
          format="percent"
          periodLabel={props.t('estados.deltaVsMesAnterior')}
        />
      )}
      {props.trend !== undefined && props.trend.length >= 2 && (
        <View marginTop={8}>
          <Sparkline points={props.trend.map((v) => v * 100)} color={marginTone(props.value) === 'positive' ? colors.green : colors.red} height={40} testID={`${props.testID}-sparkline`} />
        </View>
      )}
    </Card>
  );
}

function NumericCard(props: {
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
      {props.priorValue !== undefined && props.priorValue !== null && props.value !== null && (
        <DeltaIndicator current={props.value} previous={props.priorValue} format="number" periodLabel={props.t('estados.deltaVsMesAnterior')} />
      )}
    </Card>
  );
}

function healthVerdict(tone: 'healthy' | 'warning' | 'critical' | null, metric: string, t: T): string | null {
  if (tone === null) return null;
  const key = `estados.indicadores${metric}${tone.charAt(0).toUpperCase() + tone.slice(1)}` as Parameters<T>[0];
  return t(key) as string;
}

function rotacionSuffix(mode: 'mensual' | 'anual' | 'rango' | undefined, t: T): string {
  if (mode === 'anual') return t('estados.indicadoresRotacionSufixAnual');
  if (mode === 'mensual') return t('estados.indicadoresRotacionSufixMensual');
  return t('estados.indicadoresRotacionSufixPeriodo');
}

export function IndicadoresScreen(props: IndicadoresScreenProps): ReactElement {
  const { t } = useTranslation();
  const nanLabel = t('estados.indicadorNaN');
  const i = props.indicadores;
  const pi = props.priorIndicadores;
  const th = props.thresholds ?? DEFAULT_HEALTH_THRESHOLDS;

  const mbTone = evaluateHealth(i?.margenBruto ?? null, th.margenBruto);
  const moTone = evaluateHealth(i?.margenOperativo ?? null, th.margenOperativo);
  const mnTone = evaluateHealth(i?.margenNeto ?? null, th.margenNeto);
  const liqTone = evaluateHealth(i?.razonDeLiquidez ?? null, th.razonDeLiquidez);
  const rotTone = evaluateHealth(i?.rotacionInventario ?? null, th.rotacionInventario);
  const dcTone = evaluateHealth(i?.diasPromedioCobranza ?? null, th.diasPromedioCobranza, true);

  const rotSuffix = rotacionSuffix(props.periodoMode, t);

  return (
    <View testID={props.testID ?? 'indicadores-screen'} gap={12}>
      <SectionTitle title={props.periodoLabel} />
      <SectionTitle title={t('estados.indicadoresRentabilidadTitle')} />
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>{t('estados.indicadoresRentabilidadSubtitle')}</Text>
      <MarginCard label={t('estados.indicadoresMargenBruto')} subtitle={t('estados.indicadoresMargenBrutoSubtitle')} detail={t('estados.indicadoresMargenBrutoDetail')} value={i?.margenBruto ?? null} trend={props.trend?.margenBruto} zones={MARGIN_ZONES.bruto} healthVerdict={healthVerdict(mbTone, 'MargenBruto', t)} healthTone={mbTone} priorValue={pi?.margenBruto} testID="indicador-margen-bruto" t={t} />
      <MarginCard label={t('estados.indicadoresMargenOperativo')} subtitle={t('estados.indicadoresMargenOperativoSubtitle')} detail={t('estados.indicadoresMargenOperativoDetail')} value={i?.margenOperativo ?? null} trend={props.trend?.margenOperativo} zones={MARGIN_ZONES.operativo} healthVerdict={healthVerdict(moTone, 'MargenOperativo', t)} healthTone={moTone} priorValue={pi?.margenOperativo} testID="indicador-margen-operativo" t={t} />
      <MarginCard label={t('estados.indicadoresMargenNeto')} subtitle={t('estados.indicadoresMargenNetoSubtitle')} detail={t('estados.indicadoresMargenNetoDetail')} value={i?.margenNeto ?? null} trend={props.trend?.margenNeto} zones={MARGIN_ZONES.neto} healthVerdict={healthVerdict(mnTone, 'MargenNeto', t)} healthTone={mnTone} priorValue={pi?.margenNeto} testID="indicador-margen-neto" t={t} />

      <SectionTitle title={t('estados.indicadoresSaludTitle')} />
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>{t('estados.indicadoresSaludSubtitle')}</Text>
      <NumericCard label={t('estados.indicadoresLiquidez')} subtitle={t('estados.indicadoresLiquidezSubtitle')} detail={t('estados.indicadoresLiquidezDetail')} value={i?.razonDeLiquidez ?? null} formatter={(v) => `${v.toFixed(2)}×`} healthVerdict={healthVerdict(liqTone, 'Liquidez', t)} healthTone={liqTone} priorValue={pi?.razonDeLiquidez} nanLabel={nanLabel} testID="indicador-liquidez" t={t} />
      <NumericCard label={t('estados.indicadoresRotacion')} subtitle={t('estados.indicadoresRotacionSubtitle')} detail={t('estados.indicadoresRotacionDetail')} value={i?.rotacionInventario ?? null} formatter={(v) => `${v.toFixed(2)} ${rotSuffix}`} healthVerdict={healthVerdict(rotTone, 'Rotacion', t)} healthTone={rotTone} priorValue={pi?.rotacionInventario} nanLabel={nanLabel} testID="indicador-rotacion" t={t} />
      <NumericCard label={t('estados.indicadoresDiasCobranza')} subtitle={t('estados.indicadoresDiasCobranzaSubtitle')} detail={t('estados.indicadoresDiasCobranzaDetail')} value={i?.diasPromedioCobranza ?? null} formatter={(v) => `${Math.round(v)} ${t('estados.indicadoresDiasCobranzaSufix')}`} healthVerdict={healthVerdict(dcTone, 'DiasCobranza', t)} healthTone={dcTone} priorValue={pi?.diasPromedioCobranza} nanLabel={nanLabel} testID="indicador-dias-cobranza" t={t} />

      <Card testID="indicadores-threshold-disclosure" padding="md" fullWidth>
        <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>{t('estados.indicadoresThresholdDisclosure')}</Text>
        {props.onOpenSettings !== undefined && (
          <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight={500} fontSize={12} color={colors.blue} onPress={props.onOpenSettings} cursor="pointer" marginTop={4} testID="indicadores-settings-link">{t('estados.indicadoresThresholdSettingsLink')}</Text>
        )}
      </Card>
    </View>
  );
}
