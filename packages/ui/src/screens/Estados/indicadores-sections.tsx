import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { evaluateHealth, type HealthThresholds, type Indicadores } from '@cachink/domain';
import { Card, SectionTitle } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { MarginTrend } from '../../hooks/use-indicadores-trend';
import { MarginCard } from './indicadores-cards';
import { NumericCard } from './indicadores-cards';

type T = ReturnType<typeof useTranslation>['t'];

export interface HealthTones {
  readonly mb: 'healthy' | 'warning' | 'critical' | null;
  readonly mo: 'healthy' | 'warning' | 'critical' | null;
  readonly mn: 'healthy' | 'warning' | 'critical' | null;
  readonly liq: 'healthy' | 'warning' | 'critical' | null;
  readonly rot: 'healthy' | 'warning' | 'critical' | null;
  readonly dc: 'healthy' | 'warning' | 'critical' | null;
}

function computeMarginTones(i: Indicadores | null, th: HealthThresholds): Pick<HealthTones, 'mb' | 'mo' | 'mn'> {
  return {
    mb: evaluateHealth(i?.margenBruto ?? null, th.margenBruto),
    mo: evaluateHealth(i?.margenOperativo ?? null, th.margenOperativo),
    mn: evaluateHealth(i?.margenNeto ?? null, th.margenNeto),
  };
}

function computeSaludTones(i: Indicadores | null, th: HealthThresholds): Pick<HealthTones, 'liq' | 'rot' | 'dc'> {
  return {
    liq: evaluateHealth(i?.razonDeLiquidez ?? null, th.razonDeLiquidez),
    rot: evaluateHealth(i?.rotacionInventario ?? null, th.rotacionInventario),
    dc: evaluateHealth(i?.diasPromedioCobranza ?? null, th.diasPromedioCobranza, true),
  };
}

export function computeHealthTones(i: Indicadores | null, th: HealthThresholds): HealthTones {
  return { ...computeMarginTones(i, th), ...computeSaludTones(i, th) };
}

export function healthVerdict(tone: 'healthy' | 'warning' | 'critical' | null, metric: string, t: T): string | null {
  if (tone === null) return null;
  const key = `estados.indicadores${metric}${tone.charAt(0).toUpperCase() + tone.slice(1)}` as Parameters<T>[0];
  return t(key) as string;
}

export const MARGIN_ZONES = {
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

function nullableMargin(i: Indicadores | null, key: keyof Indicadores): number | null {
  return i?.[key] ?? null;
}

export interface RentabilidadProps {
  readonly i: Indicadores | null;
  readonly pi?: Indicadores | null;
  readonly trend?: MarginTrend | null;
  readonly tones: HealthTones;
  readonly t: T;
}

function MargenBrutoCard(props: RentabilidadProps): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <MarginCard label={t('estados.indicadoresMargenBruto')} subtitle={t('estados.indicadoresMargenBrutoSubtitle')} detail={t('estados.indicadoresMargenBrutoDetail')} value={nullableMargin(i, 'margenBruto')} trend={props.trend?.margenBruto} zones={MARGIN_ZONES.bruto} healthVerdict={healthVerdict(tones.mb, 'MargenBruto', t)} healthTone={tones.mb} priorValue={pi?.margenBruto} testID="indicador-margen-bruto" t={t} />
  );
}

function MargenOperativoCard(props: RentabilidadProps): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <MarginCard label={t('estados.indicadoresMargenOperativo')} subtitle={t('estados.indicadoresMargenOperativoSubtitle')} detail={t('estados.indicadoresMargenOperativoDetail')} value={nullableMargin(i, 'margenOperativo')} trend={props.trend?.margenOperativo} zones={MARGIN_ZONES.operativo} healthVerdict={healthVerdict(tones.mo, 'MargenOperativo', t)} healthTone={tones.mo} priorValue={pi?.margenOperativo} testID="indicador-margen-operativo" t={t} />
  );
}

function MargenNetoCard(props: RentabilidadProps): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <MarginCard label={t('estados.indicadoresMargenNeto')} subtitle={t('estados.indicadoresMargenNetoSubtitle')} detail={t('estados.indicadoresMargenNetoDetail')} value={nullableMargin(i, 'margenNeto')} trend={props.trend?.margenNeto} zones={MARGIN_ZONES.neto} healthVerdict={healthVerdict(tones.mn, 'MargenNeto', t)} healthTone={tones.mn} priorValue={pi?.margenNeto} testID="indicador-margen-neto" t={t} />
  );
}

export function RentabilidadSection(props: RentabilidadProps): ReactElement {
  const { t } = props;
  return (
    <>
      <SectionTitle title={t('estados.indicadoresRentabilidadTitle')} />
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>{t('estados.indicadoresRentabilidadSubtitle')}</Text>
      <MargenBrutoCard {...props} />
      <MargenOperativoCard {...props} />
      <MargenNetoCard {...props} />
    </>
  );
}

export function SaludSection(props: {
  i: Indicadores | null;
  pi?: Indicadores | null;
  tones: HealthTones;
  rotSuffix: string;
  nanLabel: string;
  t: T;
}): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <>
      <SectionTitle title={t('estados.indicadoresSaludTitle')} />
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>{t('estados.indicadoresSaludSubtitle')}</Text>
      <NumericCard label={t('estados.indicadoresLiquidez')} subtitle={t('estados.indicadoresLiquidezSubtitle')} detail={t('estados.indicadoresLiquidezDetail')} value={i?.razonDeLiquidez ?? null} formatter={(v) => `${v.toFixed(2)}×`} healthVerdict={healthVerdict(tones.liq, 'Liquidez', t)} healthTone={tones.liq} priorValue={pi?.razonDeLiquidez} nanLabel={props.nanLabel} testID="indicador-liquidez" t={t} />
      <NumericCard label={t('estados.indicadoresRotacion')} subtitle={t('estados.indicadoresRotacionSubtitle')} detail={t('estados.indicadoresRotacionDetail')} value={i?.rotacionInventario ?? null} formatter={(v) => `${v.toFixed(2)} ${props.rotSuffix}`} healthVerdict={healthVerdict(tones.rot, 'Rotacion', t)} healthTone={tones.rot} priorValue={pi?.rotacionInventario} nanLabel={props.nanLabel} testID="indicador-rotacion" t={t} />
      <NumericCard label={t('estados.indicadoresDiasCobranza')} subtitle={t('estados.indicadoresDiasCobranzaSubtitle')} detail={t('estados.indicadoresDiasCobranzaDetail')} value={i?.diasPromedioCobranza ?? null} formatter={(v) => `${Math.round(v)} ${t('estados.indicadoresDiasCobranzaSufix')}`} healthVerdict={healthVerdict(tones.dc, 'DiasCobranza', t)} healthTone={tones.dc} priorValue={pi?.diasPromedioCobranza} nanLabel={props.nanLabel} testID="indicador-dias-cobranza" t={t} />
    </>
  );
}

export function ThresholdDisclosure(props: { onOpenSettings?: () => void; t: T }): ReactElement {
  return (
    <Card testID="indicadores-threshold-disclosure" padding="md" fullWidth>
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>{props.t('estados.indicadoresThresholdDisclosure')}</Text>
      {props.onOpenSettings !== undefined && (
        <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight={500} fontSize={12} color={colors.blue} onPress={props.onOpenSettings} cursor="pointer" marginTop={4} testID="indicadores-settings-link">{props.t('estados.indicadoresThresholdSettingsLink')}</Text>
      )}
    </Card>
  );
}
