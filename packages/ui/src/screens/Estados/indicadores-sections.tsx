import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { evaluateHealth, type HealthThresholds, type Indicadores } from '@cachink/domain';
import { Card, SectionTitle } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
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

function computeMarginTones(
  i: Indicadores | null,
  th: HealthThresholds,
): Pick<HealthTones, 'mb' | 'mo' | 'mn'> {
  return {
    mb: evaluateHealth(i?.margenBruto ?? null, th.margenBruto),
    mo: evaluateHealth(i?.margenOperativo ?? null, th.margenOperativo),
    mn: evaluateHealth(i?.margenNeto ?? null, th.margenNeto),
  };
}

function computeSaludTones(
  i: Indicadores | null,
  th: HealthThresholds,
): Pick<HealthTones, 'liq' | 'rot' | 'dc'> {
  return {
    liq: evaluateHealth(i?.razonDeLiquidez ?? null, th.razonDeLiquidez),
    rot: evaluateHealth(i?.rotacionInventario ?? null, th.rotacionInventario),
    dc: evaluateHealth(i?.diasPromedioCobranza ?? null, th.diasPromedioCobranza, true),
  };
}

export function computeHealthTones(i: Indicadores | null, th: HealthThresholds): HealthTones {
  return { ...computeMarginTones(i, th), ...computeSaludTones(i, th) };
}

export function healthVerdict(
  tone: 'healthy' | 'warning' | 'critical' | null,
  metric: string,
  t: T,
): string | null {
  if (tone === null) return null;
  const key =
    `estados.indicadores${metric}${tone.charAt(0).toUpperCase() + tone.slice(1)}` as Parameters<T>[0];
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

export interface SaludSectionProps {
  readonly i: Indicadores | null;
  readonly pi?: Indicadores | null;
  readonly tones: HealthTones;
  readonly rotSuffix: string;
  readonly nanLabel: string;
  readonly t: T;
}

function LiquidezCard(p: SaludSectionProps): ReactElement {
  return (
    <NumericCard
      label={p.t('estados.indicadoresLiquidez')}
      subtitle={p.t('estados.indicadoresLiquidezSubtitle')}
      detail={p.t('estados.indicadoresLiquidezDetail')}
      value={p.i?.razonDeLiquidez ?? null}
      formatter={(v) => `${v.toFixed(2)}×`}
      healthVerdict={healthVerdict(p.tones.liq, 'Liquidez', p.t)}
      healthTone={p.tones.liq}
      priorValue={p.pi?.razonDeLiquidez}
      nanLabel={p.nanLabel}
      testID="indicador-liquidez"
      t={p.t}
    />
  );
}

function RotacionCard(p: SaludSectionProps): ReactElement {
  return (
    <NumericCard
      label={p.t('estados.indicadoresRotacion')}
      subtitle={p.t('estados.indicadoresRotacionSubtitle')}
      detail={p.t('estados.indicadoresRotacionDetail')}
      value={p.i?.rotacionInventario ?? null}
      formatter={(v) => `${v.toFixed(2)} ${p.rotSuffix}`}
      healthVerdict={healthVerdict(p.tones.rot, 'Rotacion', p.t)}
      healthTone={p.tones.rot}
      priorValue={p.pi?.rotacionInventario}
      nanLabel={p.nanLabel}
      testID="indicador-rotacion"
      t={p.t}
    />
  );
}

function DiasCobranzaCard(p: SaludSectionProps): ReactElement {
  return (
    <NumericCard
      label={p.t('estados.indicadoresDiasCobranza')}
      subtitle={p.t('estados.indicadoresDiasCobranzaSubtitle')}
      detail={p.t('estados.indicadoresDiasCobranzaDetail')}
      value={p.i?.diasPromedioCobranza ?? null}
      formatter={(v) => `${Math.round(v)} ${p.t('estados.indicadoresDiasCobranzaSufix')}`}
      healthVerdict={healthVerdict(p.tones.dc, 'DiasCobranza', p.t)}
      healthTone={p.tones.dc}
      priorValue={p.pi?.diasPromedioCobranza}
      nanLabel={p.nanLabel}
      testID="indicador-dias-cobranza"
      t={p.t}
    />
  );
}

export function SaludSection(props: SaludSectionProps): ReactElement {
  return (
    <>
      <SectionTitle title={props.t('estados.indicadoresSaludTitle')} />
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>
        {props.t('estados.indicadoresSaludSubtitle')}
      </Text>
      <LiquidezCard {...props} />
      <RotacionCard {...props} />
      <DiasCobranzaCard {...props} />
    </>
  );
}

export function ThresholdDisclosure(props: { onOpenSettings?: () => void; t: T }): ReactElement {
  return (
    <Card testID="indicadores-threshold-disclosure" padding="md" fullWidth>
      <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={12} color={colors.gray600}>
        {props.t('estados.indicadoresThresholdDisclosure')}
      </Text>
      {props.onOpenSettings !== undefined && (
        <Text
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight={500}
          fontSize={12}
          color={colors.blue}
          onPress={props.onOpenSettings}
          cursor="pointer"
          marginTop={4}
          testID="indicadores-settings-link"
        >
          {props.t('estados.indicadoresThresholdSettingsLink')}
        </Text>
      )}
    </Card>
  );
}
